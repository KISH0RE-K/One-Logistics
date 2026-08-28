const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../server');

const connectTestDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
};

const clearDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

const disconnectTestDB = async () => {
  await mongoose.disconnect();
};

const registerUser = async (overrides = {}) => {
  const userData = {
    name: 'Test User',
    email: 'testuser@example.com',
    password: 'password123',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(userData);
  return { token: res.body.data?.token, user: res.body.data?.user, res };
};

const registerAdmin = async () => {
  return registerUser({
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'adminpass123',
    role: 'admin',
  });
};

const sampleShipmentBody = (overrides = {}) => ({
  from: 'Chennai',
  to: 'Mumbai',
  package: {
    weight: 5,
    height: 15,
    width: 20,
    length: 30,
    packageType: 'parcel',
    fragile: false,
  },
  deliveryOption: 'Express',
  transportMode: 'Air',
  cost: 820,
  estimatedTime: 24,
  ...overrides,
});

module.exports = { connectTestDB, clearDB, disconnectTestDB, registerUser, registerAdmin, sampleShipmentBody };
