const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    vehicleNumber: {
      type: String,
      required: [true, 'Vehicle number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ['Truck', 'Van', 'Rail', 'Aircraft'],
      required: [true, 'Vehicle type is required'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    capacityKg: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1 kg'],
    },
    status: {
      type: String,
      enum: ['available', 'in_transit', 'maintenance', 'unavailable'],
      default: 'available',
    },
  },
  { timestamps: true }
);

vehicleSchema.index({ location: 1, status: 1, capacityKg: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);
