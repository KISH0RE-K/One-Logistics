const request = require('supertest');
const app = require('../server');
const { connectTestDB, clearDB, disconnectTestDB, registerUser, sampleShipmentBody } = require('./helpers');

beforeAll(connectTestDB);
afterAll(disconnectTestDB);
afterEach(clearDB);

describe('GET /api/tracking/:trackingNumber', () => {
  let trackingNumber;

  beforeEach(async () => {
    const { token } = await registerUser({ email: 'tracker@example.com' });
    const res = await request(app)
      .post('/api/shipments')
      .set('Authorization', `Bearer ${token}`)
      .send(sampleShipmentBody());
    trackingNumber = res.body.data.shipment.trackingNumber;
  });

  it('returns tracking info with events (no auth required)', async () => {
    const res = await request(app).get(`/api/tracking/${trackingNumber}`);
    expect(res.status).toBe(200);
    expect(res.body.data.trackingNumber).toBe(trackingNumber);
    expect(res.body.data.currentStatus).toBe('booked');
    expect(res.body.data.events).toBeInstanceOf(Array);
    expect(res.body.data.events.length).toBeGreaterThan(0);
    // Ensure userId is not exposed
    expect(res.body.data.userId).toBeUndefined();
  });

  it('returns 404 for unknown tracking number', async () => {
    const res = await request(app).get('/api/tracking/UPS000000000');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
