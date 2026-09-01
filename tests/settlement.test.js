const { simplifySettlements, computeBalances } = require('../src/utils/settlement');

describe('Settlement Engine - Pure Unit Tests', () => {
  describe('simplifySettlements', () => {
    test('two people: one owes another creates a single direct payment', () => {
      const balances = {
        alice: 10.0,
        bob: -10.0,
      };
      const result = simplifySettlements(balances);
      expect(result).toEqual([
        { from: 'bob', to: 'alice', amount: 10.0 },
      ]);
    });

    test('three people: reduces multiple debts to minimum transaction count', () => {
      // Alice paid $45 for dinner with Alice, Bob, Carol ($15 each)
      // Net: Alice +30, Bob -15, Carol -15
      const balances = {
        alice: 30.0,
        bob: -15.0,
        carol: -15.0,
      };
      const result = simplifySettlements(balances);
      expect(result).toHaveLength(2);
      expect(result).toEqual(
        expect.arrayContaining([
          { from: 'bob', to: 'alice', amount: 15.0 },
          { from: 'carol', to: 'alice', amount: 15.0 },
        ])
      );
    });

    test('cyclic debts: simplified directly without intermediary transfers', () => {
      // Alice owes Bob $10, Bob owes Carol $10 -> Alice pays Carol $10 directly
      const balances = {
        alice: -10.0,
        bob: 0.0,
        carol: 10.0,
      };
      const result = simplifySettlements(balances);
      expect(result).toEqual([
        { from: 'alice', to: 'carol', amount: 10.0 },
      ]);
    });

    test('four people complex multi-party split simplifies efficiently', () => {
      // Alice: +50, Bob: +20, Carol: -40, Dave: -30
      const balances = {
        alice: 50.0,
        bob: 20.0,
        carol: -40.0,
        dave: -30.0,
      };
      const result = simplifySettlements(balances);
      
      // Total amount paid should equal total debt (70)
      const totalTransferred = result.reduce((sum, t) => sum + t.amount, 0);
      expect(totalTransferred).toBeCloseTo(70.0, 2);

      // Verify that after transactions, everyone's net is 0
      const finalNet = { alice: 50, bob: 20, carol: -40, dave: -30 };
      result.forEach(t => {
        finalNet[t.from] += t.amount;
        finalNet[t.to] -= t.amount;
      });
      Object.values(finalNet).forEach(val => expect(Math.abs(val)).toBeLessThan(0.01));
    });

    test('balanced ledger produces zero transactions', () => {
      const balances = {
        alice: 0.0,
        bob: 0.0,
        carol: 0.0,
      };
      expect(simplifySettlements(balances)).toEqual([]);
    });

    test('handles float precision and negligible dust (< $0.01)', () => {
      const balances = {
        alice: 0.004,
        bob: -0.004,
      };
      expect(simplifySettlements(balances)).toEqual([]);
    });
  });

  describe('computeBalances', () => {
    test('credits payer for other members shares and debits consumers', () => {
      const receipts = [
        { id: 'r1', paid_by: 'alice' },
      ];
      const items = [
        { id: 'i1', receipt_id: 'r1' },
      ];
      const shares = [
        { item_id: 'i1', user_id: 'alice', share_amount: 10 },
        { item_id: 'i1', user_id: 'bob', share_amount: 10 },
        { item_id: 'i1', user_id: 'carol', share_amount: 10 },
      ];

      const balances = computeBalances(receipts, items, shares);

      // Alice paid $30 total ($10 is hers, Bob owes $10, Carol owes $10)
      // Alice net balance: +20
      // Bob net balance: -10
      // Carol net balance: -10
      expect(balances.alice).toBe(20);
      expect(balances.bob).toBe(-10);
      expect(balances.carol).toBe(-10);
    });

    test('handles multiple receipts with different payers correctly', () => {
      const receipts = [
        { id: 'r1', paid_by: 'alice' }, // Alice paid $20
        { id: 'r2', paid_by: 'bob' },   // Bob paid $30
      ];
      const items = [
        { id: 'i1', receipt_id: 'r1' },
        { id: 'i2', receipt_id: 'r2' },
      ];
      const shares = [
        // Receipt 1 ($20) split equally Alice ($10) & Bob ($10)
        { item_id: 'i1', user_id: 'alice', share_amount: 10 },
        { item_id: 'i1', user_id: 'bob', share_amount: 10 },
        // Receipt 2 ($30) split equally Alice ($15) & Bob ($15)
        { item_id: 'i2', user_id: 'alice', share_amount: 15 },
        { item_id: 'i2', user_id: 'bob', share_amount: 15 },
      ];

      const balances = computeBalances(receipts, items, shares);

      // From r1: Bob owes Alice $10 (Alice: +10, Bob: -10)
      // From r2: Alice owes Bob $15 (Alice: -15, Bob: +15)
      // Net: Alice = -5, Bob = +5
      expect(balances.alice).toBe(-5);
      expect(balances.bob).toBe(5);

      const settlement = simplifySettlements(balances);
      expect(settlement).toEqual([
        { from: 'alice', to: 'bob', amount: 5 },
      ]);
    });

    test('ignores items or shares without matching receipt', () => {
      const receipts = [{ id: 'r1', paid_by: 'alice' }];
      const items = [{ id: 'i1', receipt_id: 'non-existent-r' }];
      const shares = [{ item_id: 'i1', user_id: 'bob', share_amount: 10 }];

      const balances = computeBalances(receipts, items, shares);
      expect(balances).toEqual({});
    });
  });
});
