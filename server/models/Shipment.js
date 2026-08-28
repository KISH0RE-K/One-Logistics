const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const shipmentSchema = new mongoose.Schema(
  {
    // Unique index is declared once below via schema.index() - drafts have no
    // tracking number, so the index must be sparse.
    trackingNumber: {
      type: String,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PackageDetail',
    },
    from: { type: String, trim: true },
    to: { type: String, trim: true },
    deliveryOption: {
      type: String,
      enum: ['Economy', 'Normal', 'Express'],
    },
    transportMode: {
      type: String,
      enum: ['Road', 'Rail', 'Air'],
    },
    cost: { type: Number, min: [0, 'Cost cannot be negative'] },
    estimatedTime: { type: Number, min: [0, 'Estimated time cannot be negative'] }, // hours
    status: {
      type: String,
      enum: ['draft', 'booked', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'draft',
      index: true,
    },
    lastChannel: {
      type: String,
      enum: ['web', 'mobile'],
      default: 'web',
    },
    events: [eventSchema], // embedded timeline
  },
  { timestamps: true }
);

// Unique tracking number (sparse allows multiple nulls)
shipmentSchema.index({ trackingNumber: 1 }, { unique: true, sparse: true });
shipmentSchema.index({ userId: 1, status: 1 });
shipmentSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Shipment', shipmentSchema);
