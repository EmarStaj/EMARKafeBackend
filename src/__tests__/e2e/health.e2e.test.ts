import request from 'supertest';
import app from '../../../src/app';

describe('E2E: Health Check', () => {
  it('GET /health should return 200 or 503 depending on db status', async () => {
    const res = await request(app).get('/health');
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('timestamp');
  });
});
