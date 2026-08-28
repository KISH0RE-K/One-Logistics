const shipmentService = require('../services/shipmentService');
const auditService = require('../services/auditService');

const getChannel = (req) => req.body.channel || req.headers['x-channel'] || 'web';

/** POST /api/shipments */
const createShipment = async (req, res, next) => {
  try {
    const shipment = await shipmentService.createShipment(req.user._id, req.body, getChannel(req));
    await auditService.log({
      userId: req.user._id,
      action: 'CREATE_SHIPMENT',
      resource: 'shipment',
      resourceId: shipment._id,
      metadata: { trackingNumber: shipment.trackingNumber },
    });
    res.status(201).json({ success: true, data: { shipment } });
  } catch (err) {
    next(err);
  }
};

/** GET /api/shipments */
const getShipments = async (req, res, next) => {
  try {
    const { status, active } = req.query;
    const shipments = await shipmentService.getUserShipments(req.user._id, {
      status,
      active: active === 'true',
    });
    res.json({ success: true, data: { shipments, count: shipments.length } });
  } catch (err) {
    next(err);
  }
};

/** GET /api/shipments/:id */
const getShipment = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const shipment = await shipmentService.getShipmentById(req.params.id, req.user._id, isAdmin);
    await auditService.log({
      userId: req.user._id,
      action: 'VIEW_SHIPMENT',
      resource: 'shipment',
      resourceId: shipment._id,
    });
    res.json({ success: true, data: { shipment } });
  } catch (err) {
    next(err);
  }
};

/** PUT /api/shipments/:id */
const updateShipment = async (req, res, next) => {
  try {
    const shipment = await shipmentService.updateShipment(
      req.params.id,
      req.user._id,
      req.body,
      getChannel(req)
    );
    await auditService.log({
      userId: req.user._id,
      action: 'UPDATE_SHIPMENT',
      resource: 'shipment',
      resourceId: shipment._id,
    });
    res.json({ success: true, data: { shipment } });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/shipments/:id */
const deleteShipment = async (req, res, next) => {
  try {
    const result = await shipmentService.cancelShipment(req.params.id, req.user._id);
    const action = result.deleted ? 'DELETE_DRAFT' : 'CANCEL_SHIPMENT';
    await auditService.log({
      userId: req.user._id,
      action,
      resource: 'shipment',
      resourceId: req.params.id,
    });
    res.json({
      success: true,
      data: result.deleted
        ? { message: 'Draft deleted successfully' }
        : { shipment: result.shipment },
    });
  } catch (err) {
    next(err);
  }
};

/** POST /api/shipments/draft */
const saveDraft = async (req, res, next) => {
  try {
    const draft = await shipmentService.saveDraft(req.user._id, req.body, getChannel(req));
    await auditService.log({
      userId: req.user._id,
      action: 'SAVE_DRAFT',
      resource: 'shipment',
      resourceId: draft._id,
    });
    res.status(201).json({ success: true, data: { draft } });
  } catch (err) {
    next(err);
  }
};

/** GET /api/shipments/drafts */
const getDrafts = async (req, res, next) => {
  try {
    const drafts = await shipmentService.getSavedDrafts(req.user._id);
    res.json({ success: true, data: { drafts, count: drafts.length } });
  } catch (err) {
    next(err);
  }
};

/** GET /api/tracking/:trackingNumber — public */
const getTrackingInfo = async (req, res, next) => {
  try {
    const info = await shipmentService.getShipmentStatus(req.params.trackingNumber);
    res.json({ success: true, data: info });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createShipment,
  getShipments,
  getShipment,
  updateShipment,
  deleteShipment,
  saveDraft,
  getDrafts,
  getTrackingInfo,
};
