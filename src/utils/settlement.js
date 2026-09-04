/**
 * Split & Settle - Greedy Minimum Cash Flow Settlement Engine
 * 
 * Implements a pure greedy algorithm to settle N-way circular debts
 * in the minimal number of peer-to-peer monetary transfers.
 */

/**
 * Simplifies net user balances into the minimum list of direct payments.
 * 
 * @param {Record<string, number>} balances Map of userId -> net balance (positive = owed money, negative = owes money)
 * @returns {Array<{ from: string, to: string, amount: number }>} Minimal transaction settlement instructions
 */
function simplifySettlements(balances) {
  const creditors = []; // Owed money, net balance > 0
  const debtors = [];   // Owe money, net balance < 0

  Object.entries(balances || {}).forEach(([userId, amount]) => {
    const rounded = Math.round(Number(amount) * 100) / 100;
    if (rounded > 0.01) {
      creditors.push({ userId, amount: rounded });
    } else if (rounded < -0.01) {
      debtors.push({ userId, amount: Math.abs(rounded) }); // Store as positive amount owed
    }
  });

  // Sort descending by magnitude to greedy-match largest debts with largest credits
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

/**
 * Computes net balances for all members across confirmed receipts, items, and shares.
 * 
 * @param {Array<{ id: string, paid_by: string }>} receipts List of confirmed receipts
 * @param {Array<{ id: string, receipt_id: string }>} items List of line items belonging to receipts
 * @param {Array<{ item_id: string, user_id: string, share_amount: number | string }>} shares List of user item shares
 * @returns {Record<string, number>} Map of userId -> net balance (positive = owed money, negative = owes money)
 */
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
      addBalance(share.user_id, -shareAmount);   // Debtor owes this amount
      addBalance(receipt.paid_by, shareAmount);  // Payer is owed this amount
    }
  });

  return balances;
}

module.exports = { simplifySettlements, computeBalances };
