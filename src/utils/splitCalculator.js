/**
 * Utility functions for smart auto-splitting and proportional tax/tip allocations.
 */

/**
 * Splits an amount equally among a list of user IDs, distributing fractional penny remainders.
 * @param {number} totalAmount 
 * @param {string[]} userIds 
 * @returns {Array<{ userId: string, shareAmount: number }>}
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
 * @param {Object.<string, number>} userSubtotals Map of userId -> dollar subtotal spent on items
 * @param {number} taxAmount Total receipt tax
 * @param {number} tipAmount Total receipt tip
 * @returns {Object.<string, { taxShare: number, tipShare: number, totalExtra: number }>}
 */
function calculateProportionalTaxAndTip(userSubtotals, taxAmount = 0, tipAmount = 0) {
  const users = Object.keys(userSubtotals);
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
 * Generates a readable 6-character group invite code (e.g. 'TRIP26').
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
