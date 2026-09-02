const {
  manualExpenseSchema,
  createItemSchema,
  updateGroupSchema,
} = require('../src/utils/schemas');

describe('Production Readiness - Schema Validations', () => {
  describe('manualExpenseSchema', () => {
    test('valid manual expense with line items passes', () => {
      const result = manualExpenseSchema.safeParse({
        merchantName: 'Trader Joe’s',
        receiptDate: '2026-09-02',
        category: 'Groceries',
        notes: 'Weekly pantry restock',
        taxAmount: 3.50,
        tipAmount: 0,
        items: [
          { name: 'Milk', price: 4.50, quantity: 2 },
          { name: 'Eggs', price: 5.00, quantity: 1 },
        ],
      });
      expect(result.success).toBe(true);
    });

    test('manual expense with empty items array fails', () => {
      const result = manualExpenseSchema.safeParse({
        merchantName: 'Trader Joe’s',
        items: [],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createItemSchema', () => {
    test('valid line item passes', () => {
      const result = createItemSchema.safeParse({
        name: 'Extra Rice',
        price: 3.50,
        quantity: 2,
      });
      expect(result.success).toBe(true);
    });

    test('negative price fails', () => {
      const result = createItemSchema.safeParse({
        name: 'Extra Rice',
        price: -3.50,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateGroupSchema', () => {
    test('updating currency and name passes', () => {
      const result = updateGroupSchema.safeParse({
        name: 'Euro Trip 2026',
        currency: 'EUR',
      });
      expect(result.success).toBe(true);
    });

    test('empty update object fails refinement', () => {
      const result = updateGroupSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
