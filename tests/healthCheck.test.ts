import request from 'supertest';
import app from '../src/app';

describe('Health Check', () => {
  it('should have a health check endpoint at /health', async () => {
    const response = await request(app).get('/health');

    // This will fail until we implement the endpoint
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
  });
});
