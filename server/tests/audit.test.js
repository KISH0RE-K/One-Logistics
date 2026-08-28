const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const AuditLog = require('../models/AuditLog');
const { connectTestDB, clearDB, disconnectTestDB, registerUser, registerAdmin, sampleShipmentBody } = require('./helpers');

beforeAll(connectTestDB);
afterAll(disconnectTestDB);
afterEach(clearDB);

describe('Audit Logging', () => {
  it('creates a REGISTER audit log on registration', async () => {
    await registerUser({ email: 'audit@example.com' });
    const log = await AuditLog.findOne({ action: 'REGISTER' });
    expect(log).not.toBeNull();
    expect(log.resource).toBe('user');
  });

  it('creates a LOGIN audit log on login', async () => {
    await registerUser({ email: 'loginaudit@example.com', password: 'pass1234' });
    await request(app).post('/api/auth/login').send({ email: 'loginaudit@example.com', password: 'pass1234' });
    const log = await AuditLog.findOne({ action: 'LOGIN' });
    expect(log).not.toBeNull();
  });

  it('creates a CREATE_SHIPMENT audit log', async () => {
    const { token } = await registerUser({ email: 'ship@example.com' });
    await request(app).post('/api/shipments').set('Authorization', `Bearer ${token}`).send(sampleShipmentBody());
    const log = await AuditLog.findOne({ action: 'CREATE_SHIPMENT' });
    expect(log).not.toBeNull();
    expect(log.metadata.trackingNumber).toMatch(/^UPS/);
  });

  it('creates a SAVE_DRAFT audit log', async () => {
    const { token } = await registerUser({ email: 'draft@example.com' });
    await request(app).post('/api/shipments/draft').set('Authorization', `Bearer ${token}`).send({ from: 'Chennai' });
    const log = await AuditLog.findOne({ action: 'SAVE_DRAFT' });
    expect(log).not.toBeNull();
  });

  it('admin can access audit logs', async () => {
    const { token: adminToken } = await registerAdmin();
    await registerUser({ email: 'auser@example.com' }); // generates REGISTER log
    const res = await request(app).get('/api/admin/audit-logs').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.logs.length).toBeGreaterThan(0);
  });

  it('customer cannot access audit logs (403)', async () => {
    const { token } = await registerUser({ email: 'customer@example.com' });
    const res = await request(app).get('/api/admin/audit-logs').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});
