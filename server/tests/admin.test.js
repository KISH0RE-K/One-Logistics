const request = require('supertest');
const app = require('../server');
const {
  connectTestDB,
  clearDB,
  disconnectTestDB,
  registerUser,
  registerAdmin,
  sampleShipmentBody,
} = require('./helpers');

beforeAll(connectTestDB);
afterAll(disconnectTestDB);
afterEach(clearDB);

describe('Admin API', () => {
  let adminToken, customerToken;

  beforeEach(async () => {
    ({ token: adminToken } = await registerAdmin());
    ({ token: customerToken } = await registerUser({ email: 'dashcust@example.com' }));
  });

  describe('GET /api/admin/dashboard', () => {
    it('returns aggregated metrics computed from existing collections', async () => {
      // One booked shipment, one cancelled, one draft (drafts excluded from totals).
      const booked = await request(app)
        .post('/api/shipments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(sampleShipmentBody());

      const toCancel = await request(app)
        .post('/api/shipments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(sampleShipmentBody());
      await request(app)
        .delete(`/api/shipments/${toCancel.body.data.shipment._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      await request(app)
        .post('/api/shipments/draft')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ from: 'Chennai' });

      await request(app)
        .post('/api/admin/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vehicleNumber: 'DASH001',
          type: 'Truck',
          location: 'Chennai',
          capacityKg: 1000,
          status: 'available',
        });

      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(booked.status).toBe(201);

      const { shipments, vehicles, users } = res.body.data;
      expect(shipments.total).toBe(2); // draft excluded
      expect(shipments.active).toBe(1);
      expect(shipments.cancelled).toBe(1);
      expect(shipments.delivered).toBe(0);
      expect(vehicles.available).toBe(1);
      expect(vehicles.inTransit).toBe(0);
      expect(users.total).toBe(2);
    });

    it('rejects a customer with 403', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
    });

    it('rejects an unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/admin/dashboard');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/admin/vehicles', () => {
    it('rejects a customer with 403', async () => {
      const res = await request(app)
        .get('/api/admin/vehicles')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
    });

    it('rejects a customer from updating a vehicle with 403', async () => {
      const created = await request(app)
        .post('/api/admin/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vehicleNumber: 'GUARD001',
          type: 'Van',
          location: 'Chennai',
          capacityKg: 500,
        });

      const res = await request(app)
        .put(`/api/admin/vehicles/${created.body.data.vehicle._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'maintenance' });

      expect(res.status).toBe(403);
    });
  });

  describe('Query-parameter injection hardening', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/admin/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vehicleNumber: 'INJ001',
          type: 'Truck',
          location: 'Chennai',
          capacityKg: 1000,
          status: 'maintenance',
        });

      // An available vehicle in a *different* city: a wildcard that reached
      // the RegExp unescaped would match it and leak it across locations.
      await request(app)
        .post('/api/admin/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vehicleNumber: 'INJ002',
          type: 'Van',
          location: 'Mumbai',
          capacityKg: 800,
          status: 'available',
        });
    });

    it('neutralises a Mongo operator smuggled into ?userId on audit logs', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs?userId[$ne]=000000000000000000000000')
        .set('Authorization', `Bearer ${adminToken}`);

      // The operator object collapses to undefined, so the filter is ignored
      // rather than executed as a query operator.
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.logs)).toBe(true);
    });

    it('neutralises a Mongo operator smuggled into ?location on vehicle search', async () => {
      const res = await request(app)
        .get('/api/vehicles/available?location[$ne]=nowhere')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      // A successful injection would have leaked the 'maintenance' vehicle.
      expect(res.body.data.vehicles.every((v) => v.status === 'available')).toBe(true);
    });

    it('treats regex metacharacters in ?location as literal text', async () => {
      const res = await request(app)
        .get('/api/vehicles/available?location=.*')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(0);
    });

    it('does not leak drafts through ?status=draft on GET /api/shipments', async () => {
      await request(app)
        .post('/api/shipments/draft')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ from: 'Chennai' });

      const res = await request(app)
        .get('/api/shipments?status=draft')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(0);
    });
  });

  describe('Public route isolation', () => {
    it('keeps /api/tracking public even though /api/chat requires auth', async () => {
      const created = await request(app)
        .post('/api/shipments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(sampleShipmentBody());

      const res = await request(app).get(
        `/api/tracking/${created.body.data.shipment.trackingNumber}`
      );

      expect(res.status).toBe(200);
      expect(res.body.data.userId).toBeUndefined();
    });

    it('returns 404 with the standard error shape for an unknown route', async () => {
      const res = await request(app).get('/api/does-not-exist');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(typeof res.body.message).toBe('string');
    });
  });
});
