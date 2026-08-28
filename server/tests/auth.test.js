const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../server');
const { connectTestDB, clearDB, disconnectTestDB, registerUser } = require('./helpers');

beforeAll(connectTestDB);
afterAll(disconnectTestDB);
afterEach(clearDB);

describe('POST /api/auth/register', () => {
  it('registers a new customer and returns token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'securepass123',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('customer');
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('rejects duplicate email with 409', async () => {
    await registerUser({ email: 'dup@example.com' });
    const res = await request(app).post('/api/auth/register').send({
      name: 'Other',
      email: 'dup@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('rejects invalid email format with 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test',
      email: 'not-an-email',
      password: 'password123',
    });
    expect(res.status).toBe(400);
  });

  it('rejects missing required fields with 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'x@x.com' });
    expect(res.status).toBe(400);
  });

  it('rejects short password with 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test',
      email: 'test@example.com',
      password: 'short',
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => registerUser({ email: 'login@example.com', password: 'correctpass' }));

  it('returns token for valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'correctpass',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  it('rejects wrong password with 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'wrongpass',
    });
    expect(res.status).toBe(401);
  });

  it('rejects non-existent email with 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns user profile for valid token', async () => {
    const { token, user } = await registerUser({ email: 'me@example.com' });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('me@example.com');
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('rejects request without token with 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects invalid token with 401', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer garbage_token');
    expect(res.status).toBe(401);
  });
});
