const request = require('supertest');
const app = require('../app');
const { setupTestDB, teardownTestDB, clearTestDB } = require('./setup');

describe('Dashboard Routes', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  const userData = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'Password123!',
    confirmPassword: 'Password123!'
  };

  let authenticatedAgent;

  beforeEach(async () => {
    // Create and login user for protected routes
    authenticatedAgent = request.agent(app);
    
    await authenticatedAgent
      .post('/auth/register')
      .send(userData);
  });

  describe('GET /dashboard', () => {
    test('should access dashboard when authenticated', async () => {
      const response = await authenticatedAgent
        .get('/dashboard')
        .expect(200);

      expect(response.text).toContain('Dashboard');
    });

    test('should redirect to login when not authenticated', async () => {
      const response = await request(app)
        .get('/dashboard')
        .expect(302);

      expect(response.headers.location).toBe('/auth/login');
    });
  });

  describe('GET /dashboard/profile', () => {
    test('should access profile when authenticated', async () => {
      const response = await authenticatedAgent
        .get('/dashboard/profile')
        .expect(200);

      expect(response.text).toContain('Profile');
    });

    test('should redirect to login when not authenticated', async () => {
      const response = await request(app)
        .get('/dashboard/profile')
        .expect(302);

      expect(response.headers.location).toBe('/auth/login');
    });
  });

  describe('GET /dashboard/soil-analysis', () => {
    test('should access soil analysis when authenticated', async () => {
      const response = await authenticatedAgent
        .get('/dashboard/soil-analysis')
        .expect(200);

      expect(response.text).toContain('Soil Analysis');
    });
  });

  describe('GET /dashboard/reports', () => {
    test('should access reports when authenticated', async () => {
      const response = await authenticatedAgent
        .get('/dashboard/reports')
        .expect(200);

      expect(response.text).toContain('Reports');
    });
  });
});
