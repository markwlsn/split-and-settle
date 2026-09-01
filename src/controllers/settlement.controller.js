const { computeBalances, simplifySettlements } = require('../utils/settlement');

async function recomputeSettlements(supabase, groupId) {
  // 1. Fetch confirmed receipts
  const { data: receipts, error: receiptsError } = await supabase
    .from('receipts')
    .select('id, paid_by')
    .eq('group_id', groupId)
    .eq('status', 'confirmed');

  if (receiptsError || !receipts) {
    throw new Error(`Failed to fetch receipts for settlement: ${receiptsError?.message}`);
  }

  const receiptIds = receipts.map(r => r.id);
  let items = [];
  let shares = [];

  if (receiptIds.length > 0) {
    const { data: itemsData, error: itemsError } = await supabase
      .from('receipt_items')
      .select('id, receipt_id')
      .in('receipt_id', receiptIds);

    if (itemsError) throw itemsError;
    items = itemsData || [];

    const itemIds = items.map(i => i.id);
    if (itemIds.length > 0) {
      const { data: sharesData, error: sharesError } = await supabase
        .from('item_shares')
        .select('item_id, user_id, share_amount')
        .in('item_id', itemIds);

      if (sharesError) throw sharesError;
      shares = sharesData || [];
    }
  }

  // 2. Compute net balances from confirmed receipts & item shares
  const balances = computeBalances(receipts, items, shares);

  // 3. Adjust balances with recorded direct payments
  const { data: payments, error: paymentsError } = await supabase
    .from('settlements')
    .select('*')
    .eq('group_id', groupId)
    .eq('type', 'payment');

  if (paymentsError) throw paymentsError;

  (payments || []).forEach(p => {
    const pAmount = parseFloat(p.amount) || 0;
    balances[p.from_user] = Math.round(((balances[p.from_user] || 0) + pAmount) * 100) / 100;
    balances[p.to_user] = Math.round(((balances[p.to_user] || 0) - pAmount) * 100) / 100;
  });

  // 4. Simplify debts to minimum-transaction set
  const simplified = simplifySettlements(balances);

  // 5. Replace existing computed settlements atomically
  const { error: deleteError } = await supabase
    .from('settlements')
    .delete()
    .eq('group_id', groupId)
    .eq('type', 'computed');

  if (deleteError) throw deleteError;

  if (simplified.length > 0) {
    const rows = simplified.map(t => ({
      group_id: groupId,
      from_user: t.from,
      to_user: t.to,
      amount: t.amount,
      type: 'computed',
      settled: false,
    }));

    const { error: insertError } = await supabase
      .from('settlements')
      .insert(rows);

    if (insertError) throw insertError;
  }
}

async function confirmReceipt(req, res, next) {
  try {
    const { id: receiptId } = req.params;

    // Check receipt existence
    const { data: existing, error: findError } = await req.supabase
      .from('receipts')
      .select('*')
      .eq('id', receiptId)
      .single();

    if (findError || !existing) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    if (existing.status === 'pending') {
      return res.status(400).json({
        error: 'Receipt must be parsed and itemized before confirming',
      });
    }

    const { data: receipt, error: updateError } = await req.supabase
      .from('receipts')
      .update({ status: 'confirmed' })
      .eq('id', receiptId)
      .select()
      .single();

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    await recomputeSettlements(req.supabase, receipt.group_id);

    return res.json({
      receipt,
      message: 'Receipt confirmed and group settlements recalculated successfully',
    });
  } catch (err) {
    next(err);
  }
}

async function listSettlements(req, res, next) {
  try {
    const { id: groupId } = req.params;

    const { data, error } = await req.supabase
      .from('settlements')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const computed = data.filter(s => s.type === 'computed');
    const payments = data.filter(s => s.type === 'payment');

    return res.json({
      settlements: computed,
      paymentHistory: payments,
    });
  } catch (err) {
    next(err);
  }
}

async function recordPayment(req, res, next) {
  try {
    const { id: groupId } = req.params;
    const { toUser, amount } = req.body;

    const { data: payment, error } = await req.supabase
      .from('settlements')
      .insert({
        group_id: groupId,
        from_user: req.userId,
        to_user: toUser,
        amount: Math.round(Number(amount) * 100) / 100,
        type: 'payment',
        settled: true,
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    await recomputeSettlements(req.supabase, groupId);

    return res.status(201).json({
      payment,
      message: 'Payment recorded and group settlements updated',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  recomputeSettlements,
  confirmReceipt,
  listSettlements,
  recordPayment,
};
