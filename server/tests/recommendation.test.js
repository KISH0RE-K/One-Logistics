const request = require('supertest');
const axios = require('axios');
const app = require('../server');
const { connectTestDB, clearDB, disconnectTestDB, registerUser } = require('./helpers');

// Mock axios to avoid hitting real ML service in tests
jest.mock('axios');

beforeAll(connectTestDB);
afterAll(disconnectTestDB);
afterEach(clearDB);

const samplePayload = {
  from: 'Chennai',
  to: 'Mumbai',
  weight: 5,
  height: 15,
  width: 20,
  length: 30,
  deliveryOption: 'Express',
  packageType: 'parcel',
};

const mockMlResponse = {
  recommendedMode: 'Air',
  options: [
    { mode: 'Road', cost: 480, time: 60 },
    { mode: 'Rail', cost: 350, time: 96 },
    { mode: 'Air', cost: 820, time: 24 },
  ],
};

describe('POST /api/recommendation', () => {
  let token;

  beforeEach(async () => {
    ({ token } = await registerUser({ email: 'rec@example.com' }));
  });

  it('forwards request to ML service and returns recommendation', async () => {
    axios.post.mockResolvedValueOnce({ data: mockMlResponse });

    const res = await request(app)
      .post('/api/recommendation')
      .set('Authorization', `Bearer ${token}`)
      .send(samplePayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.recommendedMode).toBe('Air');
    expect(res.body.data.options).toHaveLength(3);
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/recommend'),
      expect.objectContaining({ from: 'Chennai' }),
      expect.any(Object)
    );
  });

  it('returns 503 when ML service is unreachable', async () => {
    const err = new Error('Connection refused');
    err.code = 'ECONNREFUSED';
    axios.post.mockRejectedValueOnce(err);

    const res = await request(app)
      .post('/api/recommendation')
      .set('Authorization', `Bearer ${token}`)
      .send(samplePayload);

    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
  });

  it('returns 504 when ML service times out', async () => {
    const err = new Error('Timeout');
    err.code = 'ETIMEDOUT';
    axios.post.mockRejectedValueOnce(err);

    const res = await request(app)
      .post('/api/recommendation')
      .set('Authorization', `Bearer ${token}`)
      .send(samplePayload);

    expect(res.status).toBe(504);
  });

  it('rejects missing fields with 400', async () => {
    const res = await request(app)
      .post('/api/recommendation')
      .set('Authorization', `Bearer ${token}`)
      .send({ from: 'Chennai' });
    expect(res.status).toBe(400);
  });

  it('rejects unauthenticated request with 401', async () => {
    const res = await request(app).post('/api/recommendation').send(samplePayload);
    expect(res.status).toBe(401);
  });
});
