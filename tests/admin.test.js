const request = require('supertest');
const app = require('../src/app');
const { updateTicketSchema } = require('../src/utils/schemas');
const { requireAdmin } = require('../src/middleware/admin.middleware');

describe('Admin Security & RBAC Unit & Route Tests', () => {
  describe('Admin Routes Authorization Guard', () => {
    test('GET /admin/stats without token returns 401 Unauthorized', async () => {
      const res = await request(app).get('/admin/stats');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toMatch(/token/i);
    });

    test('GET /admin/tickets without token returns 401 Unauthorized', async () => {
      const res = await request(app).get('/admin/tickets');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    test('GET /admin/bills without token returns 401 Unauthorized', async () => {
      const res = await request(app).get('/admin/bills');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    test('GET /admin/users without token returns 401 Unauthorized', async () => {
      const res = await request(app).get('/admin/users');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    test('GET /admin/audit-logs without token returns 401 Unauthorized', async () => {
      const res = await request(app).get('/admin/audit-logs');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    test('POST /admin/users/:id/archive without token returns 401 Unauthorized', async () => {
      const res = await request(app).post('/admin/users/test-id/archive').send({ reason: 'Test' });
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    test('POST /admin/users/:id/unarchive without token returns 401 Unauthorized', async () => {
      const res = await request(app).post('/admin/users/test-id/unarchive');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('requireAdmin Middleware Logic', () => {
    test('rejects request if user is not an admin with 403 Forbidden', async () => {
      const req = {
        userId: 'regular-user-id',
        user: {
          email: 'regular@example.com',
          user_metadata: { role: 'user' },
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringMatching(/Administrator privileges required/i),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('allows request if user has role: admin in user_metadata', async () => {
      const req = {
        userId: 'admin-user-id',
        user: {
          email: 'admin@company.com',
          user_metadata: { role: 'admin' },
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await requireAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.isAdmin).toBe(true);
    });

    test('allows request if user email matches primary administrator email', async () => {
      const req = {
        userId: 'owner-id',
        user: {
          email: 'markwilsongeronilla01@gmail.com',
          user_metadata: {},
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await requireAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.isAdmin).toBe(true);
    });
  });

  describe('updateTicketSchema Zod Validations', () => {
    test('valid status and admin notes pass validation', () => {
      const result = updateTicketSchema.safeParse({
        status: 'resolved',
        adminNotes: 'Addressed in v1.2 update.',
        priority: 'high',
      });
      expect(result.success).toBe(true);
    });

    test('all valid statuses (open, in_progress, resolved, closed) succeed', () => {
      const statuses = ['open', 'in_progress', 'resolved', 'closed'];
      statuses.forEach((status) => {
        const result = updateTicketSchema.safeParse({ status });
        expect(result.success).toBe(true);
      });
    });

    test('invalid status fails validation', () => {
      const result = updateTicketSchema.safeParse({
        status: 'invalid_status_xyz',
      });
      expect(result.success).toBe(false);
    });

    test('invalid priority fails validation', () => {
      const result = updateTicketSchema.safeParse({
        priority: 'critical_emergency',
      });
      expect(result.success).toBe(false);
    });

    test('empty object passes since all fields are optional for partial updates', () => {
      const result = updateTicketSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});
