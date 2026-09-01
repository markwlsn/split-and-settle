const request = require('supertest');
const app = require('../src/app');
const {
  groupSchema,
  memberSchema,
  updateItemSchema,
  sharesSchema,
  paymentSchema,
} = require('../src/utils/schemas');

describe('API Smoke & Route Tests', () => {
  test('GET /health returns status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('timestamp');
  });

  test('Protected route without token returns 401', async () => {
    const res = await request(app).get('/groups');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatch(/token/i);
  });

  test('POST /auth/register with invalid email returns 400 Bad Request', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        email: 'not-an-email',
        password: '123',
        name: '',
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('Undefined route returns 404', async () => {
    const res = await request(app).get('/api/unknown/endpoint');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

describe('Zod Schema Unit Validations', () => {
  describe('groupSchema', () => {
    test('valid group passes validation', () => {
      const result = groupSchema.safeParse({ name: 'Trip to Tokyo', displayName: 'Leader' });
      expect(result.success).toBe(true);
    });

    test('missing name fails validation', () => {
      const result = groupSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('memberSchema', () => {
    test('valid member with UUID passes', () => {
      const result = memberSchema.safeParse({
        userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        displayName: 'Bob',
      });
      expect(result.success).toBe(true);
    });

    test('invalid UUID format fails', () => {
      const result = memberSchema.safeParse({
        userId: '123-non-uuid',
        displayName: 'Bob',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateItemSchema', () => {
    test('updating valid price and name passes', () => {
      const result = updateItemSchema.safeParse({
        name: 'Ramen',
        price: 14.5,
      });
      expect(result.success).toBe(true);
    });

    test('empty body fails refinement', () => {
      const result = updateItemSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    test('negative price fails', () => {
      const result = updateItemSchema.safeParse({ price: -5 });
      expect(result.success).toBe(false);
    });
  });

  describe('sharesSchema', () => {
    test('valid shares array passes', () => {
      const result = sharesSchema.safeParse({
        shares: [
          { userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', shareAmount: 10.5 },
          { userId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', shareAmount: 5.5 },
        ],
      });
      expect(result.success).toBe(true);
    });

    test('empty shares array fails', () => {
      const result = sharesSchema.safeParse({ shares: [] });
      expect(result.success).toBe(false);
    });
  });

  describe('paymentSchema', () => {
    test('valid payment payload passes', () => {
      const result = paymentSchema.safeParse({
        toUser: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        amount: 25.0,
      });
      expect(result.success).toBe(true);
    });

    test('non-positive amount fails', () => {
      const result = paymentSchema.safeParse({
        toUser: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        amount: -10,
      });
      expect(result.success).toBe(false);
    });
  });
});
