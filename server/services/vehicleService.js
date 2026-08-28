const Vehicle = require('../models/Vehicle');
const { AppError } = require('../middleware/errorHandler');
const { asQueryString, asQueryNumber, escapeRegex } = require('../utils/validators');

/**
 * Case-insensitive exact-match filter on a free-text field.
 * The value is regex-escaped so caller input is always treated as a literal.
 */
const locationFilter = (location) => new RegExp(`^${escapeRegex(location)}$`, 'i');

/**
 * Get available vehicles matching location and minimum capacity.
 * LLM function signature: getAvailableVehicles(location, weight)
 *
 * Conditions: status === 'available', location matches, capacityKg >= weight.
 */
const getAvailableVehicles = async (location, weight) => {
  const query = { status: 'available' };

  const loc = asQueryString(location);
  if (loc) query.location = locationFilter(loc);

  const minCapacity = asQueryNumber(weight);
  if (minCapacity !== undefined && minCapacity > 0) query.capacityKg = { $gte: minCapacity };

  return Vehicle.find(query).sort({ capacityKg: 1 });
};

/**
 * Get all vehicles with optional filters (admin use).
 */
const getAllVehicles = async (filters = {}) => {
  const query = {};

  const status = asQueryString(filters.status);
  if (status) query.status = status;

  const type = asQueryString(filters.type);
  if (type) query.type = type;

  const location = asQueryString(filters.location);
  if (location) query.location = locationFilter(location);

  return Vehicle.find(query).sort({ createdAt: -1 });
};

/**
 * Create a new vehicle (admin).
 */
const createVehicle = async (data) => {
  return Vehicle.create(data);
};

/**
 * Update a vehicle by ID (admin).
 */
const updateVehicle = async (vehicleId, updates) => {
  const vehicle = await Vehicle.findByIdAndUpdate(vehicleId, updates, {
    new: true,
    runValidators: true,
  });
  if (!vehicle) throw new AppError('Vehicle not found', 404);
  return vehicle;
};

module.exports = { getAvailableVehicles, getAllVehicles, createVehicle, updateVehicle };
