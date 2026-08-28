const vehicleService = require('../services/vehicleService');

/**
 * GET /api/vehicles/available?location=Chennai&weight=500
 *
 * Customer-facing: returns only vehicles with status 'available' whose
 * location matches and whose capacityKg covers the requested weight.
 * Query values are sanitised inside the service before reaching Mongo.
 */
const getAvailableVehicles = async (req, res, next) => {
  try {
    const { location, weight } = req.query;
    const vehicles = await vehicleService.getAvailableVehicles(location, weight);
    res.json({ success: true, data: { vehicles, count: vehicles.length } });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAvailableVehicles };
