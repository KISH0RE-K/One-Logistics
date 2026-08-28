const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async () => {
  const mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  process.env.JWT_SECRET = 'test_jwt_secret_32_chars_minimum_ok';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.ML_SERVICE_URL = 'http://localhost:8000';
  process.env.NODE_ENV = 'test';
  global.__MONGO_SERVER__ = mongoServer;
};
