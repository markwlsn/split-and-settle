const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  name: z.string().min(1, { message: 'Name is required' }),
});

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

const groupSchema = z.object({
  name: z.string().min(1, { message: 'Group name is required' }),
  displayName: z.string().min(1).optional(),
  currency: z.string().min(1).max(5).optional(),
});

const updateGroupSchema = z.object({
  name: z.string().min(1).optional(),
  currency: z.string().min(1).max(5).optional(),
  regenerateInviteCode: z.boolean().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided to update group',
});

const joinGroupSchema = z.object({
  inviteCode: z.string().min(4, { message: 'Invite code must be at least 4 characters' }).toUpperCase(),
  displayName: z.string().min(1, { message: 'Display name is required' }),
});

const memberSchema = z.object({
  userId: z.string().uuid({ message: 'Valid user UUID is required' }),
  displayName: z.string().min(1, { message: 'Display name is required' }),
});

const createItemSchema = z.object({
  name: z.string().min(1, { message: 'Item name is required' }),
  price: z.number().positive({ message: 'Price must be positive' }),
  quantity: z.number().int().positive({ message: 'Quantity must be a positive integer' }).optional(),
});

const updateItemSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.number().positive({ message: 'Price must be positive' }).optional(),
  quantity: z.number().int().positive({ message: 'Quantity must be a positive integer' }).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field (name, price, quantity) must be provided for update',
});

const manualExpenseSchema = z.object({
  merchantName: z.string().min(1, { message: 'Merchant/Expense title is required' }),
  receiptDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' }).nullable().optional(),
  category: z.enum([
    'Food & Dining',
    'Groceries',
    'Transport',
    'Entertainment',
    'Lodging',
    'Utilities',
    'Shopping',
    'Other',
  ]).optional(),
  notes: z.string().optional(),
  paidBy: z.string().uuid().optional(),
  taxAmount: z.number().nonnegative().optional(),
  tipAmount: z.number().nonnegative().optional(),
  items: z.array(createItemSchema).min(1, { message: 'At least one item is required' }),
});

const updateReceiptSchema = z.object({
  merchantName: z.string().optional(),
  receiptDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' }).nullable().optional(),
  totalAmount: z.number().positive().optional(),
  taxAmount: z.number().nonnegative().optional(),
  tipAmount: z.number().nonnegative().optional(),
  category: z.enum([
    'Food & Dining',
    'Groceries',
    'Transport',
    'Entertainment',
    'Lodging',
    'Utilities',
    'Shopping',
    'Other',
  ]).optional(),
  notes: z.string().optional(),
  paidBy: z.string().uuid().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for receipt update',
});

const sharesSchema = z.object({
  shares: z.array(
    z.object({
      userId: z.string().uuid({ message: 'Valid user UUID is required' }),
      shareAmount: z.number().positive({ message: 'Share amount must be a positive number' }),
    })
  ).min(1, { message: 'At least one share entry is required' }),
});

const autoSplitSchema = z.object({
  mode: z.enum(['EQUAL_ALL', 'EQUAL_SELECTED', 'PROPORTIONAL_TAX_TIP'], {
    message: 'Mode must be EQUAL_ALL, EQUAL_SELECTED, or PROPORTIONAL_TAX_TIP',
  }),
  userIds: z.array(z.string().uuid({ message: 'Invalid user UUID' })).optional(),
});

const paymentSchema = z.object({
  toUser: z.string().uuid({ message: 'Valid recipient user UUID is required' }),
  amount: z.number().positive({ message: 'Payment amount must be positive' }),
});

module.exports = {
  registerSchema,
  loginSchema,
  groupSchema,
  updateGroupSchema,
  joinGroupSchema,
  memberSchema,
  createItemSchema,
  updateItemSchema,
  manualExpenseSchema,
  updateReceiptSchema,
  sharesSchema,
  autoSplitSchema,
  paymentSchema,
};
