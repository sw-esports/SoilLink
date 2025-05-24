const request = require('supertest');
const app = require('../app');

describe('Health Check Routes', () => {
  describe('GET /api/health/health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/api/health/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
    });
  });

  describe('GET /api/health/ready', () => {
    test('should return readiness status', async () => {
      const response = await request(app)
        .get('/api/health/ready')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('checks');
      expect(response.body.checks).toHaveProperty('database');
    });
  });

  describe('GET /api/health/metrics', () => {
    test('should return system metrics', async () => {
      const response = await request(app)
        .get('/api/health/metrics')
        .expect(200);

      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('cpu');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('database');
    });
  });
});

describe('Security Headers', () => {
  test('should include security headers', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);

    expect(response.headers).toHaveProperty('x-content-type-options');
    expect(response.headers).toHaveProperty('x-frame-options');
    expect(response.headers).toHaveProperty('x-xss-protection');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
  });
});

describe('Rate Limiting', () => {
  test('should apply rate limiting to auth routes', async () => {
    const requests = [];
    
    // Make multiple requests quickly
    for (let i = 0; i < 10; i++) {
      requests.push(
        request(app)
          .post('/auth/login')
          .send({ email: 'test@example.com', password: 'password' })
      );
    }

    const responses = await Promise.all(requests);
    
    // Should eventually get rate limited
    const rateLimitedResponses = responses.filter(res => res.status === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });
});
