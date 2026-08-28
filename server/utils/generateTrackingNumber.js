const crypto = require('crypto');
const Shipment = require('../models/Shipment');

/**
 * Generate a unique tracking number: UPS + 9-digit random integer.
 * Retries up to 5 times to guarantee DB uniqueness.
 */
const generateTrackingNumber = async () => {
  for (let i = 0; i < 5; i++) {
    const digits = crypto.randomInt(100000000, 999999999);
    const trackingNumber = `UPS${digits}`;
    const exists = await Shipment.exists({ trackingNumber });
    if (!exists) return trackingNumber;
  }
  throw new Error('Failed to generate a unique tracking number after 5 attempts');
};

module.exports = generateTrackingNumber;
