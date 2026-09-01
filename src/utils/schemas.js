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
});

const memberSchema = z.object({
  userId: z.string().uuid({ message: 'Valid user UUID is required' }),
  displayName: z.string().min(1, { message: 'Display name is required' }),
});

const updateItemSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.number().positive({ message: 'Price must be positive' }).optional(),
  quantity: z.number().int().positive({ message: 'Quantity must be a positive integer' }).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field (name, price, quantity) must be provided for update',
});

const sharesSchema = z.object({
  shares: z.array(
    z.object({
      userId: z.string().uuid({ message: 'Valid user UUID is required' }),
      shareAmount: z.number().positive({ message: 'Share amount must be a positive number' }),
    })
  ).min(1, { message: 'At least one share entry is required' }),
});

const paymentSchema = z.object({
  toUser: z.string().uuid({ message: 'Valid recipient user UUID is required' }),
  amount: z.number().positive({ message: 'Payment amount must be positive' }),
});

module.exports = {
  registerSchema,
  loginSchema,
  groupSchema,
  memberSchema,
  updateItemSchema,
  sharesSchema,
  paymentSchema,
};
