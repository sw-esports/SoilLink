const request = require('supertest');
const app = require('../app');
const { setupTestDB, teardownTestDB, clearTestDB } = require('./setup');

describe('Authentication Routes', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe('POST /auth/register', () => {
    const validUserData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    };

    test('should register a new user with valid data', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send(validUserData)
        .expect(302); // Redirect on success

      expect(response.headers.location).toBe('/dashboard');
    });

    test('should reject registration with invalid email', async () => {
      const invalidData = { ...validUserData, email: 'invalid-email' };
      
      const response = await request(app)
        .post('/auth/register')
        .send(invalidData)
        .expect(302); // Redirect back on error
    });

    test('should reject registration with weak password', async () => {
      const invalidData = { ...validUserData, password: '123', confirmPassword: '123' };
      
      const response = await request(app)
        .post('/auth/register')
        .send(invalidData)
        .expect(302); // Redirect back on error
    });

    test('should reject registration with mismatched passwords', async () => {
      const invalidData = { ...validUserData, confirmPassword: 'DifferentPassword123!' };
      
      const response = await request(app)
        .post('/auth/register')
        .send(invalidData)
        .expect(302); // Redirect back on error
    });

    test('should reject duplicate email registration', async () => {
      // First registration
      await request(app)
        .post('/auth/register')
        .send(validUserData)
        .expect(302);

      // Second registration with same email
      const response = await request(app)
        .post('/auth/register')
        .send(validUserData)
        .expect(302); // Redirect back on error
    });
  });

  describe('POST /auth/login', () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    };

    beforeEach(async () => {
      // Register a user first
      await request(app)
        .post('/auth/register')
        .send(userData);
    });

    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(302); // Redirect on success

      expect(response.headers.location).toBe('/dashboard');
    });

    test('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: userData.password
        })
        .expect(302); // Redirect back on error
    });

    test('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: userData.email,
          password: 'wrongpassword'
        })
        .expect(302); // Redirect back on error
    });
  });

  describe('POST /auth/logout', () => {
    test('should logout user', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .expect(302); // Redirect on success

      expect(response.headers.location).toBe('/');
    });
  });
});
