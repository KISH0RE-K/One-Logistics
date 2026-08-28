const request = require('supertest');
const app = require('../server');
const { connectTestDB, clearDB, disconnectTestDB, registerUser, sampleShipmentBody } = require('./helpers');

beforeAll(connectTestDB);
afterAll(disconnectTestDB);
afterEach(clearDB);

describe('Shipment API', () => {
  let tokenA, tokenB;

  beforeEach(async () => {
    ({ token: tokenA } = await registerUser({ email: 'userA@example.com' }));
    ({ token: tokenB } = await registerUser({ email: 'userB@example.com', name: 'User B' }));
  });

  describe('POST /api/shipments', () => {
    it('creates a confirmed shipment with tracking number', async () => {
      const res = await request(app)
        .post('/api/shipments')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(sampleShipmentBody());
      expect(res.status).toBe(201);
      expect(res.body.data.shipment.status).toBe('booked');
      expect(res.body.data.shipment.trackingNumber).toMatch(/^UPS\d{9}$/);
      expect(res.body.data.shipment.events.length).toBeGreaterThan(0);
    });

    it('rejects missing required fields with 400', async () => {
      const res = await request(app)
        .post('/api/shipments')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ from: 'Chennai' });
      expect(res.status).toBe(400);
    });

    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).post('/api/shipments').send(sampleShipmentBody());
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/shipments', () => {
    it("returns only the authenticated user's shipments", async () => {
      await request(app).post('/api/shipments').set('Authorization', `Bearer ${tokenA}`).send(sampleShipmentBody());
      await request(app).post('/api/shipments').set('Authorization', `Bearer ${tokenB}`).send(sampleShipmentBody());

      const res = await request(app).get('/api/shipments').set('Authorization', `Bearer ${tokenA}`);
      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(1);
    });
  });

  describe('GET /api/shipments/:id — ownership enforcement', () => {
    it('allows owner to get their own shipment', async () => {
      const createRes = await request(app)
        .post('/api/shipments')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(sampleShipmentBody());
      const id = createRes.body.data.shipment._id;

      const res = await request(app).get(`/api/shipments/${id}`).set('Authorization', `Bearer ${tokenA}`);
      expect(res.status).toBe(200);
    });

    it('denies User B access to User A shipment with 403', async () => {
      const createRes = await request(app)
        .post('/api/shipments')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(sampleShipmentBody());
      const id = createRes.body.data.shipment._id;

      const res = await request(app).get(`/api/shipments/${id}`).set('Authorization', `Bearer ${tokenB}`);
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/shipments/:id', () => {
    it('cancels a booked shipment (not deleted)', async () => {
      const createRes = await request(app)
        .post('/api/shipments')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(sampleShipmentBody());
      const id = createRes.body.data.shipment._id;

      const res = await request(app).delete(`/api/shipments/${id}`).set('Authorization', `Bearer ${tokenA}`);
      expect(res.status).toBe(200);
      expect(res.body.data.shipment.status).toBe('cancelled');
    });

    it('denies User B from cancelling User A shipment', async () => {
      const createRes = await request(app)
        .post('/api/shipments')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(sampleShipmentBody());
      const id = createRes.body.data.shipment._id;

      const res = await request(app).delete(`/api/shipments/${id}`).set('Authorization', `Bearer ${tokenB}`);
      expect(res.status).toBe(403);
    });
  });

  describe('Draft management', () => {
    it('saves a draft and retrieves it', async () => {
      const saveRes = await request(app)
        .post('/api/shipments/draft')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ from: 'Chennai', to: 'Delhi', channel: 'web' });
      expect(saveRes.status).toBe(201);
      expect(saveRes.body.data.draft.status).toBe('draft');
      expect(saveRes.body.data.draft.lastChannel).toBe('web');

      const draftRes = await request(app).get('/api/shipments/drafts').set('Authorization', `Bearer ${tokenA}`);
      expect(draftRes.status).toBe(200);
      expect(draftRes.body.data.count).toBe(1);
    });

    it('draft saved on web is accessible from mobile (same user)', async () => {
      await request(app)
        .post('/api/shipments/draft')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ from: 'Chennai', channel: 'web' });

      // Simulate mobile retrieval
      const res = await request(app)
        .get('/api/shipments/drafts')
        .set('Authorization', `Bearer ${tokenA}`)
        .set('X-Channel', 'mobile');
      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(1);
    });

    it("User B cannot see User A's drafts", async () => {
      await request(app)
        .post('/api/shipments/draft')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ from: 'Chennai' });

      const res = await request(app).get('/api/shipments/drafts').set('Authorization', `Bearer ${tokenB}`);
      expect(res.body.data.count).toBe(0);
    });

    it('promotes draft to booked on update', async () => {
      const draftRes = await request(app)
        .post('/api/shipments/draft')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(sampleShipmentBody());
      const draftId = draftRes.body.data.draft._id;

      const res = await request(app)
        .put(`/api/shipments/${draftId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'booked' });
      expect(res.status).toBe(200);
      expect(res.body.data.shipment.status).toBe('booked');
      expect(res.body.data.shipment.trackingNumber).toMatch(/^UPS\d{9}$/);
    });

    it('deletes a draft physically on DELETE', async () => {
      const draftRes = await request(app)
        .post('/api/shipments/draft')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ from: 'Chennai' });
      const draftId = draftRes.body.data.draft._id;

      const res = await request(app).delete(`/api/shipments/${draftId}`).set('Authorization', `Bearer ${tokenA}`);
      expect(res.status).toBe(200);
      expect(res.body.data.message).toContain('deleted');
    });
  });
});
