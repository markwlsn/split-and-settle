const request = require('supertest');
const app = require('../src/app');

describe('Health and Observability Endpoints', () => {
  test('GET /health returns 200 with service metadata', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('split-and-settle-api');
    expect(res.body.timestamp).toBeDefined();
    expect(res.headers['x-request-id']).toBeDefined();
  });

  test('GET /unknown-route returns 404 with structured error', async () => {
    const res = await request(app).get('/non-existent-endpoint');
    expect(res.status).toBe(404);
    expect(res.body.error).toContain('Not Found');
    expect(res.headers['x-request-id']).toBeDefined();
  });
});
