// balances: { [userId]: netAmount } where positive = owed money, negative = owes money
// returns minimum-transaction list to settle everyone up: [{ from: string, to: string, amount: number }]
function simplifySettlements(balances) {
  const creditors = []; // owed money, net > 0
  const debtors = [];   // owe money, net < 0

  Object.entries(balances || {}).forEach(([userId, amount]) => {
    const rounded = Math.round(Number(amount) * 100) / 100;
    if (rounded > 0.01) {
      creditors.push({ userId, amount: rounded });
    } else if (rounded < -0.01) {
      debtors.push({ userId, amount: Math.abs(rounded) }); // store as positive amount owed
    }
  });

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.round(Math.min(debtor.amount, creditor.amount) * 100) / 100;

    if (amount > 0.01) {
      transactions.push({ from: debtor.userId, to: creditor.userId, amount });
    }

    debtor.amount = Math.round((debtor.amount - amount) * 100) / 100;
    creditor.amount = Math.round((creditor.amount - amount) * 100) / 100;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return transactions;
}

// Computes net balances from item shares + who paid, for a set of confirmed receipts.
// receipts: [{ id, paid_by }], items: [{ id, receipt_id }], shares: [{ item_id, user_id, share_amount }]
function computeBalances(receipts, items, shares) {
  const balances = {};
  const addBalance = (userId, amount) => {
    balances[userId] = Math.round(((balances[userId] || 0) + Number(amount)) * 100) / 100;
  };

  const itemToReceipt = {};
  (items || []).forEach(i => {
    itemToReceipt[i.id] = i.receipt_id;
  });

  const receiptById = {};
  (receipts || []).forEach(r => {
    receiptById[r.id] = r;
  });

  (shares || []).forEach(share => {
    const receiptId = itemToReceipt[share.item_id];
    const receipt = receiptById[receiptId];
    if (!receipt) return;

    const shareAmount = parseFloat(share.share_amount) || 0;
    if (share.user_id !== receipt.paid_by) {
      addBalance(share.user_id, -shareAmount);   // debtor owes this amount
      addBalance(receipt.paid_by, shareAmount);  // payer is owed this amount
    }
  });

  return balances;
}

module.exports = { simplifySettlements, computeBalances };
