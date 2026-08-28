const Shipment = require('../models/Shipment');
const Package = require('../models/Package');
const generateTrackingNumber = require('../utils/generateTrackingNumber');
const { AppError } = require('../middleware/errorHandler');
const { asQueryString } = require('../utils/validators');

// ─── LLM-callable service functions ──────────────────────────────────────────
// These clean interfaces can later be wrapped as LLM tool definitions.

/**
 * Create a confirmed shipment.
 * LLM function signature: createShipment(userId, shipmentData)
 */
const createShipment = async (userId, shipmentData, channel = 'web') => {
  const { from, to, package: pkg, deliveryOption, transportMode, cost, estimatedTime } = shipmentData;

  // 1. Create package record
  const packageDoc = await Package.create(pkg);

  // 2. Generate unique tracking number
  const trackingNumber = await generateTrackingNumber();

  // 3. Create shipment with initial event
  const shipment = await Shipment.create({
    userId,
    packageId: packageDoc._id,
    from,
    to,
    deliveryOption,
    transportMode,
    cost,
    estimatedTime,
    trackingNumber,
    status: 'booked',
    lastChannel: channel,
    events: [
      {
        status: 'Booked',
        location: from,
        description: 'Shipment has been confirmed and is awaiting pickup.',
        timestamp: new Date(),
      },
    ],
  });

  return shipment.populate('packageId');
};

/**
 * Save a partial shipment as a draft.
 * LLM function signature: saveDraft(userId, draftData)
 */
const saveDraft = async (userId, draftData, channel = 'web') => {
  const { package: pkg, channel: _ch, ...rest } = draftData;

  let packageId;
  if (pkg && Object.keys(pkg).length) {
    const packageDoc = await Package.create(pkg);
    packageId = packageDoc._id;
  }

  const draft = await Shipment.create({
    userId,
    ...rest,
    ...(packageId && { packageId }),
    status: 'draft',
    lastChannel: channel,
  });

  return draft.populate('packageId');
};

/**
 * Get a user's confirmed shipments (excludes drafts by default).
 * LLM function signature: getUserShipments(userId, filters)
 */
const getUserShipments = async (userId, filters = {}) => {
  const query = { userId };

  // Drafts are served by getSavedDrafts() and are excluded here by default.
  const status = asQueryString(filters.status);

  if (filters.active) {
    query.status = { $in: ['booked', 'in_transit', 'out_for_delivery'] };
  } else if (status && status !== 'draft') {
    query.status = status;
  } else {
    query.status = { $ne: 'draft' };
  }

  return Shipment.find(query).populate('packageId').sort({ createdAt: -1 });
};

/**
 * Get all draft shipments for a user.
 * LLM function signature: getSavedDrafts(userId)
 */
const getSavedDrafts = async (userId) => {
  return Shipment.find({ userId, status: 'draft' })
    .populate('packageId')
    .sort({ updatedAt: -1 });
};

/**
 * Get a single shipment by ID, enforcing ownership.
 */
const getShipmentById = async (shipmentId, userId, isAdmin = false) => {
  const shipment = await Shipment.findById(shipmentId).populate('packageId');
  if (!shipment) throw new AppError('Shipment not found', 404);
  if (!isAdmin && shipment.userId.toString() !== userId.toString()) {
    throw new AppError('Access denied', 403);
  }
  return shipment;
};

/**
 * Update a shipment, promoting a draft to booked when status changes.
 */
const updateShipment = async (shipmentId, userId, updates, channel = 'web') => {
  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) throw new AppError('Shipment not found', 404);
  if (shipment.userId.toString() !== userId.toString()) {
    throw new AppError('Access denied', 403);
  }
  if (['delivered', 'cancelled'].includes(shipment.status)) {
    throw new AppError(`Cannot update a ${shipment.status} shipment`, 400);
  }

  const { package: pkg, channel: _ch, status: newStatus, ...rest } = updates;

  // Update embedded package if provided
  if (pkg && Object.keys(pkg).length) {
    if (shipment.packageId) {
      await Package.findByIdAndUpdate(shipment.packageId, pkg, { runValidators: true });
    } else {
      const packageDoc = await Package.create(pkg);
      shipment.packageId = packageDoc._id;
    }
  }

  // Promoting draft → booked: generate tracking number and add event
  if (newStatus === 'booked' && shipment.status === 'draft') {
    shipment.trackingNumber = await generateTrackingNumber();
    shipment.events.push({
      status: 'Booked',
      location: rest.from || shipment.from || 'Origin',
      description: 'Draft shipment confirmed and booked.',
      timestamp: new Date(),
    });
  }

  // Apply remaining scalar updates
  Object.assign(shipment, rest);
  if (newStatus) shipment.status = newStatus;
  shipment.lastChannel = channel;

  await shipment.save();
  return shipment.populate('packageId');
};

/**
 * Cancel a confirmed shipment or physically delete a draft.
 */
const cancelShipment = async (shipmentId, userId) => {
  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) throw new AppError('Shipment not found', 404);
  if (shipment.userId.toString() !== userId.toString()) {
    throw new AppError('Access denied', 403);
  }

  if (shipment.status === 'draft') {
    await Shipment.findByIdAndDelete(shipmentId);
    if (shipment.packageId) await Package.findByIdAndDelete(shipment.packageId);
    return { deleted: true };
  }

  if (shipment.status === 'delivered') {
    throw new AppError('Cannot cancel a delivered shipment', 400);
  }
  if (shipment.status === 'cancelled') {
    throw new AppError('Shipment is already cancelled', 400);
  }

  shipment.status = 'cancelled';
  shipment.events.push({
    status: 'Cancelled',
    location: shipment.from || 'N/A',
    description: 'Shipment cancelled by customer.',
    timestamp: new Date(),
  });
  await shipment.save();
  return { deleted: false, shipment };
};

/**
 * Get public shipment tracking info by tracking number.
 * LLM function signature: getShipmentStatus(trackingNumber)
 */
const getShipmentStatus = async (trackingNumber) => {
  const shipment = await Shipment.findOne({ trackingNumber }).populate('packageId');
  if (!shipment) throw new AppError('Tracking number not found', 404);

  return {
    trackingNumber: shipment.trackingNumber,
    currentStatus: shipment.status,
    from: shipment.from,
    to: shipment.to,
    transportMode: shipment.transportMode,
    deliveryOption: shipment.deliveryOption,
    estimatedTime: shipment.estimatedTime,
    cost: shipment.cost,
    packageDetails: shipment.packageId,
    events: shipment.events,
  };
};

module.exports = {
  createShipment,
  saveDraft,
  getUserShipments,
  getSavedDrafts,
  getShipmentById,
  updateShipment,
  cancelShipment,
  getShipmentStatus,
};
