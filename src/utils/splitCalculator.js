/**
 * Split & Settle - Split Calculator & Rounding Reconciliation Utilities
 * 
 * Provides penny-exact equal division, proportional tax/tip allocations,
 * and unambiguous group invite code generation.
 */

/**
 * Splits an amount equally among a list of user IDs, distributing fractional penny remainders.
 * Guarantees that sum(shares) === totalAmount down to exact $0.00 precision.
 * 
 * @param {number} totalAmount The total dollar or monetary amount to divide
 * @param {string[]} userIds List of user IDs receiving equal shares
 * @returns {Array<{ userId: string, shareAmount: number }>} Distributed equal shares with penny reconciliation
 * 
 * @example
 * calculateEqualShares(10.00, ['u1', 'u2', 'u3'])
 * // => [{ userId: 'u1', shareAmount: 3.34 }, { userId: 'u2', shareAmount: 3.33 }, { userId: 'u3', shareAmount: 3.33 }]
 */
function calculateEqualShares(totalAmount, userIds) {
  if (!userIds || userIds.length === 0) return [];
  const count = userIds.length;
  const totalCents = Math.round(Number(totalAmount) * 100);
  const baseCents = Math.floor(totalCents / count);
  let remainderCents = totalCents % count;

  return userIds.map(userId => {
    let cents = baseCents;
    if (remainderCents > 0) {
      cents += 1;
      remainderCents -= 1;
    }
    return {
      userId,
      shareAmount: cents / 100,
    };
  });
}

/**
 * Proportionally distributes tax and tip amounts based on each user's itemized subtotal spend.
 * Last member receives penny reconciliation adjustments to ensure exact sum match.
 * 
 * @param {Object.<string, number>} userSubtotals Map of userId -> dollar subtotal spent on items
 * @param {number} taxAmount Total receipt tax
 * @param {number} tipAmount Total receipt tip
 * @returns {Object.<string, { taxShare: number, tipShare: number, totalExtra: number }>} Proportional extra charges
 */
function calculateProportionalTaxAndTip(userSubtotals, taxAmount = 0, tipAmount = 0) {
  const users = Object.keys(userSubtotals || {});
  if (users.length === 0) return {};

  const totalSubtotal = Object.values(userSubtotals).reduce((sum, val) => sum + Number(val), 0);
  if (totalSubtotal <= 0) {
    // If subtotal is 0, distribute tax and tip equally
    const equalTax = calculateEqualShares(taxAmount, users);
    const equalTip = calculateEqualShares(tipAmount, users);
    const result = {};
    users.forEach(u => {
      const tax = equalTax.find(t => t.userId === u)?.shareAmount || 0;
      const tip = equalTip.find(t => t.userId === u)?.shareAmount || 0;
      result[u] = {
        taxShare: tax,
        tipShare: tip,
        totalExtra: Math.round((tax + tip) * 100) / 100,
      };
    });
    return result;
  }

  const taxCents = Math.round(Number(taxAmount) * 100);
  const tipCents = Math.round(Number(tipAmount) * 100);

  let allocatedTaxCents = 0;
  let allocatedTipCents = 0;
  const result = {};

  users.forEach((userId, index) => {
    const ratio = userSubtotals[userId] / totalSubtotal;
    let uTaxCents = Math.round(taxCents * ratio);
    let uTipCents = Math.round(tipCents * ratio);

    // On last user, reconcile any penny rounding difference
    if (index === users.length - 1) {
      uTaxCents = taxCents - allocatedTaxCents;
      uTipCents = tipCents - allocatedTipCents;
    } else {
      allocatedTaxCents += uTaxCents;
      allocatedTipCents += uTipCents;
    }

    const taxShare = uTaxCents / 100;
    const tipShare = uTipCents / 100;
    result[userId] = {
      taxShare,
      tipShare,
      totalExtra: Math.round((taxShare + tipShare) * 100) / 100,
    };
  });

  return result;
}

/**
 * Generates an unambiguous 6-character alphanumeric group invite code (e.g. 'TRIP26').
 * Excludes easily confused characters (0, O, 1, I).
 * 
 * @returns {string} 6-character uppercase invite code
 */
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

module.exports = {
  calculateEqualShares,
  calculateProportionalTaxAndTip,
  generateInviteCode,
};
