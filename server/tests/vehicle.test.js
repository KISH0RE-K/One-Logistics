const request = require('supertest');
const app = require('../server');
const { connectTestDB, clearDB, disconnectTestDB, registerUser, registerAdmin } = require('./helpers');

beforeAll(connectTestDB);
afterAll(disconnectTestDB);
afterEach(clearDB);

const sampleVehicle = (overrides = {}) => ({
  vehicleNumber: 'TN01AB1234',
  type: 'Truck',
  location: 'Chennai',
  capacityKg: 1000,
  status: 'available',
  ...overrides,
});

describe('Vehicle API', () => {
  let adminToken, customerToken;

  beforeEach(async () => {
    ({ token: adminToken } = await registerAdmin());
    ({ token: customerToken } = await registerUser({ email: 'cust@example.com' }));
  });

  describe('Admin vehicle management', () => {
    it('admin can create a vehicle', async () => {
      const res = await request(app)
        .post('/api/admin/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(sampleVehicle());
      expect(res.status).toBe(201);
      expect(res.body.data.vehicle.vehicleNumber).toBe('TN01AB1234');
    });

    it('customer cannot create a vehicle (403)', async () => {
      const res = await request(app)
        .post('/api/admin/vehicles')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(sampleVehicle());
      expect(res.status).toBe(403);
    });

    it('admin can update a vehicle', async () => {
      const create = await request(app)
        .post('/api/admin/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(sampleVehicle());
      const id = create.body.data.vehicle._id;

      const res = await request(app)
        .put(`/api/admin/vehicles/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'in_transit' });
      expect(res.status).toBe(200);
      expect(res.body.data.vehicle.status).toBe('in_transit');
    });
  });

  describe('GET /api/vehicles/available', () => {
    beforeEach(async () => {
      await request(app).post('/api/admin/vehicles').set('Authorization', `Bearer ${adminToken}`).send(sampleVehicle({ vehicleNumber: 'V001', capacityKg: 500, location: 'Chennai' }));
      await request(app).post('/api/admin/vehicles').set('Authorization', `Bearer ${adminToken}`).send(sampleVehicle({ vehicleNumber: 'V002', capacityKg: 1000, location: 'Mumbai', status: 'in_transit' }));
    });

    it('returns available vehicles matching location and weight', async () => {
      const res = await request(app)
        .get('/api/vehicles/available?location=Chennai&weight=200')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.vehicles.every((v) => v.status === 'available')).toBe(true);
    });

    it('excludes vehicles not meeting weight capacity', async () => {
      const res = await request(app)
        .get('/api/vehicles/available?location=Chennai&weight=600')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(0);
    });

    it('excludes in_transit vehicles', async () => {
      const res = await request(app)
        .get('/api/vehicles/available?location=Mumbai')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(0);
    });
  });
});
