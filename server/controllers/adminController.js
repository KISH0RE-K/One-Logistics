const mongoose = require('mongoose');
const Shipment = require('../models/Shipment');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const vehicleService = require('../services/vehicleService');
const auditService = require('../services/auditService');
const { asQueryString, asQueryNumber } = require('../utils/validators');

/** GET /api/admin/dashboard */
const getDashboard = async (req, res, next) => {
  try {
    const [
      totalShipments,
      activeShipments,
      deliveredShipments,
      cancelledShipments,
      availableVehicles,
      vehiclesInTransit,
      totalUsers,
    ] = await Promise.all([
      Shipment.countDocuments({ status: { $ne: 'draft' } }),
      Shipment.countDocuments({ status: { $in: ['booked', 'in_transit', 'out_for_delivery'] } }),
      Shipment.countDocuments({ status: 'delivered' }),
      Shipment.countDocuments({ status: 'cancelled' }),
      Vehicle.countDocuments({ status: 'available' }),
      Vehicle.countDocuments({ status: 'in_transit' }),
      User.countDocuments(),
    ]);

    res.json({
      success: true,
      data: {
        shipments: { total: totalShipments, active: activeShipments, delivered: deliveredShipments, cancelled: cancelledShipments },
        vehicles: { available: availableVehicles, inTransit: vehiclesInTransit },
        users: { total: totalUsers },
      },
    });
  } catch (err) {
    next(err);
  }
};

/** GET /api/admin/audit-logs */
const getAuditLogs = async (req, res, next) => {
  try {
    // Query params are untrusted: coerce to primitives so no Mongo operator
    // can be smuggled in via `?userId[$ne]=`.
    const action = asQueryString(req.query.action);
    const userId = asQueryString(req.query.userId);
    const page = Math.max(1, asQueryNumber(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, asQueryNumber(req.query.limit) || 50));

    const query = {};
    if (action) query.action = action;
    if (userId && mongoose.isValidObjectId(userId)) query.userId = userId;

    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('userId', 'name email role')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        logs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

/** GET /api/admin/vehicles */
const getVehicles = async (req, res, next) => {
  try {
    const vehicles = await vehicleService.getAllVehicles(req.query);
    res.json({ success: true, data: { vehicles, count: vehicles.length } });
  } catch (err) {
    next(err);
  }
};

/** POST /api/admin/vehicles */
const createVehicle = async (req, res, next) => {
  try {
    const vehicle = await vehicleService.createVehicle(req.body);
    await auditService.log({
      userId: req.user._id,
      action: 'CREATE_VEHICLE',
      resource: 'vehicle',
      resourceId: vehicle._id,
    });
    res.status(201).json({ success: true, data: { vehicle } });
  } catch (err) {
    next(err);
  }
};

/** PUT /api/admin/vehicles/:id */
const updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await vehicleService.updateVehicle(req.params.id, req.body);
    await auditService.log({
      userId: req.user._id,
      action: 'UPDATE_VEHICLE',
      resource: 'vehicle',
      resourceId: vehicle._id,
    });
    res.json({ success: true, data: { vehicle } });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard, getAuditLogs, getVehicles, createVehicle, updateVehicle };
