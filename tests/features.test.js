const {
  calculateEqualShares,
  calculateProportionalTaxAndTip,
  generateInviteCode,
} = require('../src/utils/splitCalculator');
const {
  joinGroupSchema,
  updateReceiptSchema,
  autoSplitSchema,
} = require('../src/utils/schemas');

describe('Hackathon Features Unit Tests', () => {
  describe('splitCalculator - calculateEqualShares', () => {
    test('splits $10.00 among 3 people with exact penny reconciliation ($3.34, $3.33, $3.33)', () => {
      const userIds = ['user1', 'user2', 'user3'];
      const shares = calculateEqualShares(10.00, userIds);

      expect(shares).toHaveLength(3);
      expect(shares[0].shareAmount).toBe(3.34);
      expect(shares[1].shareAmount).toBe(3.33);
      expect(shares[2].shareAmount).toBe(3.33);

      const total = shares.reduce((acc, s) => acc + s.shareAmount, 0);
      expect(Math.round(total * 100) / 100).toBe(10.00);
    });

    test('splits $25.00 equally among 4 people ($6.25 each)', () => {
      const userIds = ['u1', 'u2', 'u3', 'u4'];
      const shares = calculateEqualShares(25.00, userIds);

      expect(shares.every(s => s.shareAmount === 6.25)).toBe(true);
      const total = shares.reduce((acc, s) => acc + s.shareAmount, 0);
      expect(total).toBe(25.00);
    });

    test('returns empty array when no users provided', () => {
      expect(calculateEqualShares(50.00, [])).toEqual([]);
    });
  });

  describe('splitCalculator - calculateProportionalTaxAndTip', () => {
    test('proportional 75%/25% split for unequal item consumption', () => {
      // Alice bought $30 of food, Bob bought $10 of food (Total subtotal = $40)
      // Tax: $4.00, Tip: $6.00 (Total extra: $10.00)
      const userSubtotals = {
        alice: 30.00,
        bob: 10.00,
      };

      const result = calculateProportionalTaxAndTip(userSubtotals, 4.00, 6.00);

      // Alice pays 75% of tax ($3.00) and tip ($4.50) = $7.50
      expect(result.alice.taxShare).toBe(3.00);
      expect(result.alice.tipShare).toBe(4.50);
      expect(result.alice.totalExtra).toBe(7.50);

      // Bob pays 25% of tax ($1.00) and tip ($1.50) = $2.50
      expect(result.bob.taxShare).toBe(1.00);
      expect(result.bob.tipShare).toBe(1.50);
      expect(result.bob.totalExtra).toBe(2.50);
    });

    test('handles 0 subtotal by falling back to equal division', () => {
      const userSubtotals = { u1: 0, u2: 0 };
      const result = calculateProportionalTaxAndTip(userSubtotals, 2.00, 4.00);

      expect(result.u1.taxShare).toBe(1.00);
      expect(result.u1.tipShare).toBe(2.00);
      expect(result.u2.taxShare).toBe(1.00);
      expect(result.u2.tipShare).toBe(2.00);
    });
  });

  describe('generateInviteCode', () => {
    test('generates a 6-character uppercase alphanumeric string', () => {
      const code = generateInviteCode();
      expect(code).toHaveLength(6);
      expect(/^[A-Z0-9]{6}$/.test(code)).toBe(true);
    });
  });

  describe('Zod Schema Validations for New Features', () => {
    describe('joinGroupSchema', () => {
      test('valid invite code and display name pass', () => {
        const result = joinGroupSchema.safeParse({
          inviteCode: 'trip26',
          displayName: 'Charlie',
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.inviteCode).toBe('TRIP26');
        }
      });

      test('too short invite code fails', () => {
        const result = joinGroupSchema.safeParse({
          inviteCode: 'ab',
          displayName: 'Charlie',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('updateReceiptSchema', () => {
      test('updating category, notes, and payer passes', () => {
        const result = updateReceiptSchema.safeParse({
          category: 'Food & Dining',
          notes: 'Dinner at Shibuya',
          paidBy: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          taxAmount: 5.50,
          tipAmount: 10.00,
        });
        expect(result.success).toBe(true);
      });

      test('invalid category fails', () => {
        const result = updateReceiptSchema.safeParse({
          category: 'InvalidCategory',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('autoSplitSchema', () => {
      test('EQUAL_ALL mode passes without userIds', () => {
        const result = autoSplitSchema.safeParse({
          mode: 'EQUAL_ALL',
        });
        expect(result.success).toBe(true);
      });

      test('EQUAL_SELECTED mode passes with valid UUIDs', () => {
        const result = autoSplitSchema.safeParse({
          mode: 'EQUAL_SELECTED',
          userIds: [
            'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
          ],
        });
        expect(result.success).toBe(true);
      });
    });
  });
});
