require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Shipment = require('../models/Shipment');
const Package = require('../models/Package');
const Vehicle = require('../models/Vehicle');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ups_logistics';

const seed = async () => {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB for seeding...');

  // Clear existing demo data
  await Promise.all([
    User.deleteMany({}),
    Shipment.deleteMany({}),
    Package.deleteMany({}),
    Vehicle.deleteMany({}),
  ]);
  console.log('Cleared existing data.');

  // ── Users ────────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('demo1234', 12);

  const [admin, alice, bob, carol] = await User.insertMany([
    { name: 'Admin User', email: 'admin@ups-demo.com', passwordHash, role: 'admin' },
    { name: 'Alice Kumar', email: 'alice@ups-demo.com', passwordHash, role: 'customer' },
    { name: 'Bob Sharma', email: 'bob@ups-demo.com', passwordHash, role: 'customer' },
    { name: 'Carol Nair', email: 'carol@ups-demo.com', passwordHash, role: 'customer' },
  ]);
  console.log('Seeded 4 users.');

  // ── Vehicles ─────────────────────────────────────────────────────────────────
  await Vehicle.insertMany([
    { vehicleNumber: 'TN01TR001', type: 'Truck',    location: 'Chennai',   capacityKg: 5000,  status: 'available' },
    { vehicleNumber: 'MH02TK002', type: 'Truck',    location: 'Mumbai',    capacityKg: 3000,  status: 'available' },
    { vehicleNumber: 'KA03VN003', type: 'Van',      location: 'Bangalore', capacityKg: 800,   status: 'in_transit' },
    { vehicleNumber: 'DL04AC004', type: 'Aircraft', location: 'Delhi',     capacityKg: 10000, status: 'available' },
    { vehicleNumber: 'TN05RL005', type: 'Rail',     location: 'Chennai',   capacityKg: 20000, status: 'available' },
    { vehicleNumber: 'MH06VN006', type: 'Van',      location: 'Mumbai',    capacityKg: 600,   status: 'maintenance' },
  ]);
  console.log('Seeded 6 vehicles.');

  // ── Packages ─────────────────────────────────────────────────────────────────
  const [pkg1, pkg2, pkg3, pkg4] = await Package.insertMany([
    { weight: 5,  height: 15, width: 20, length: 30, packageType: 'parcel',      fragile: false },
    { weight: 2,  height: 10, width: 10, length: 10, packageType: 'document',    fragile: false },
    { weight: 15, height: 40, width: 35, length: 50, packageType: 'electronics', fragile: true  },
    { weight: 1,  height: 5,  width: 8,  length: 12, packageType: 'document',    fragile: false },
  ]);

  // ── Shipments ─────────────────────────────────────────────────────────────────
  const now = new Date();
  const daysAgo = (n) => new Date(now - n * 86400000);

  await Shipment.insertMany([
    {
      trackingNumber: 'UPS100000001',
      userId: alice._id,
      packageId: pkg1._id,
      from: 'Chennai',
      to: 'Mumbai',
      deliveryOption: 'Express',
      transportMode: 'Air',
      cost: 820,
      estimatedTime: 24,
      status: 'delivered',
      lastChannel: 'web',
      events: [
        { status: 'Booked',           location: 'Chennai',   description: 'Shipment booked.',                timestamp: daysAgo(5) },
        { status: 'Picked Up',        location: 'Chennai',   description: 'Package picked up by courier.',   timestamp: daysAgo(4) },
        { status: 'In Transit',       location: 'Bangalore', description: 'En route to Mumbai.',             timestamp: daysAgo(3) },
        { status: 'Out for Delivery', location: 'Mumbai',    description: 'Package out for delivery.',       timestamp: daysAgo(1) },
        { status: 'Delivered',        location: 'Mumbai',    description: 'Package delivered successfully.', timestamp: daysAgo(0) },
      ],
      createdAt: daysAgo(5),
    },
    {
      trackingNumber: 'UPS100000002',
      userId: alice._id,
      packageId: pkg2._id,
      from: 'Chennai',
      to: 'Delhi',
      deliveryOption: 'Normal',
      transportMode: 'Rail',
      cost: 350,
      estimatedTime: 96,
      status: 'in_transit',
      lastChannel: 'mobile',
      events: [
        { status: 'Booked',     location: 'Chennai', description: 'Shipment booked.',       timestamp: daysAgo(2) },
        { status: 'In Transit', location: 'Chennai', description: 'Loaded onto train.',     timestamp: daysAgo(1) },
      ],
      createdAt: daysAgo(2),
    },
    {
      trackingNumber: 'UPS100000003',
      userId: bob._id,
      packageId: pkg3._id,
      from: 'Mumbai',
      to: 'Hyderabad',
      deliveryOption: 'Economy',
      transportMode: 'Road',
      cost: 480,
      estimatedTime: 60,
      status: 'booked',
      lastChannel: 'web',
      events: [
        { status: 'Booked', location: 'Mumbai', description: 'Shipment booked and awaiting pickup.', timestamp: daysAgo(0) },
      ],
      createdAt: daysAgo(0),
    },
    // Draft shipment
    {
      userId: carol._id,
      packageId: pkg4._id,
      from: 'Bangalore',
      to: 'Pune',
      deliveryOption: 'Express',
      status: 'draft',
      lastChannel: 'web',
      events: [],
      createdAt: daysAgo(0),
    },
  ]);
  console.log('Seeded 3 confirmed shipments and 1 draft.');

  console.log('\n✅  Seed complete!');
  console.log('Demo credentials (password: demo1234):');
  console.log('  Admin:    admin@ups-demo.com');
  console.log('  Customer: alice@ups-demo.com | bob@ups-demo.com | carol@ups-demo.com');

  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
