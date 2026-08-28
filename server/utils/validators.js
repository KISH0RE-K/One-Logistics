const Joi = require('joi');

// -- Query-parameter sanitisation --------------------------------------------
// Express parses `?status[$ne]=draft` into a nested object. Feeding that
// straight into a Mongoose filter hands the caller a query operator, so every
// untrusted value that reaches a filter is forced to a primitive first.

/**
 * Coerce an untrusted query value to a plain string, or undefined.
 * Arrays and objects (i.e. injected operators) collapse to undefined.
 */
const asQueryString = (value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') return value.trim() || undefined;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return undefined;
};

/**
 * Coerce an untrusted query value to a finite number, or undefined.
 */
const asQueryNumber = (value) => {
  const str = asQueryString(value);
  if (str === undefined) return undefined;
  const num = Number(str);
  return Number.isFinite(num) ? num : undefined;
};

/**
 * Escape regex metacharacters so a user-supplied string can be used inside a
 * RegExp as a literal - prevents both injection and catastrophic backtracking.
 */
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ── Auth ──────────────────────────────────────────────────────────────────────

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'any.required': 'Name is required',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'any.required': 'Password is required',
  }),
  role: Joi.string().valid('customer', 'admin').default('customer'),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// ── Package (reusable sub-object) ─────────────────────────────────────────────

const packageSchema = Joi.object({
  weight: Joi.number().positive().required().messages({
    'number.positive': 'Weight must be greater than 0',
    'any.required': 'Weight is required',
  }),
  height: Joi.number().positive().required().messages({
    'number.positive': 'Height must be greater than 0',
    'any.required': 'Height is required',
  }),
  width: Joi.number().positive().required().messages({
    'number.positive': 'Width must be greater than 0',
    'any.required': 'Width is required',
  }),
  length: Joi.number().positive().required().messages({
    'number.positive': 'Length must be greater than 0',
    'any.required': 'Length is required',
  }),
  packageType: Joi.string()
    .valid('document', 'parcel', 'fragile', 'electronics', 'other')
    .required(),
  fragile: Joi.boolean().default(false),
});

const partialPackageSchema = Joi.object({
  weight: Joi.number().positive(),
  height: Joi.number().positive(),
  width: Joi.number().positive(),
  length: Joi.number().positive(),
  packageType: Joi.string().valid('document', 'parcel', 'fragile', 'electronics', 'other'),
  fragile: Joi.boolean(),
});

// ── Shipments ─────────────────────────────────────────────────────────────────

const createShipmentSchema = Joi.object({
  from: Joi.string().required(),
  to: Joi.string().required(),
  package: packageSchema.required(),
  deliveryOption: Joi.string().valid('Economy', 'Normal', 'Express').required(),
  transportMode: Joi.string().valid('Road', 'Rail', 'Air').required(),
  cost: Joi.number().min(0),
  estimatedTime: Joi.number().min(0),
  channel: Joi.string().valid('web', 'mobile').default('web'),
});

const saveDraftSchema = Joi.object({
  from: Joi.string(),
  to: Joi.string(),
  package: partialPackageSchema,
  deliveryOption: Joi.string().valid('Economy', 'Normal', 'Express'),
  transportMode: Joi.string().valid('Road', 'Rail', 'Air'),
  cost: Joi.number().min(0),
  estimatedTime: Joi.number().min(0),
  channel: Joi.string().valid('web', 'mobile').default('web'),
});

const updateShipmentSchema = Joi.object({
  from: Joi.string(),
  to: Joi.string(),
  package: partialPackageSchema,
  deliveryOption: Joi.string().valid('Economy', 'Normal', 'Express'),
  transportMode: Joi.string().valid('Road', 'Rail', 'Air'),
  cost: Joi.number().min(0),
  estimatedTime: Joi.number().min(0),
  status: Joi.string().valid('booked', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled'),
  channel: Joi.string().valid('web', 'mobile'),
});

// ── Vehicles ──────────────────────────────────────────────────────────────────

const createVehicleSchema = Joi.object({
  vehicleNumber: Joi.string().required(),
  type: Joi.string().valid('Truck', 'Van', 'Rail', 'Aircraft').required(),
  location: Joi.string().required(),
  capacityKg: Joi.number().positive().required(),
  status: Joi.string().valid('available', 'in_transit', 'maintenance', 'unavailable').default('available'),
});

const updateVehicleSchema = Joi.object({
  vehicleNumber: Joi.string(),
  type: Joi.string().valid('Truck', 'Van', 'Rail', 'Aircraft'),
  location: Joi.string(),
  capacityKg: Joi.number().positive(),
  status: Joi.string().valid('available', 'in_transit', 'maintenance', 'unavailable'),
}).min(1);

// ── Recommendation ────────────────────────────────────────────────────────────

const recommendationSchema = Joi.object({
  from: Joi.string().required(),
  to: Joi.string().required(),
  weight: Joi.number().positive().required(),
  height: Joi.number().positive().required(),
  width: Joi.number().positive().required(),
  length: Joi.number().positive().required(),
  deliveryOption: Joi.string().valid('Economy', 'Normal', 'Express').required(),
  packageType: Joi.string().valid('document', 'parcel', 'fragile', 'electronics', 'other').required(),
});

// ── Chat ──────────────────────────────────────────────────────────────────────

const chatMessageSchema = Joi.object({
  message: Joi.string().min(1).max(2000).required(),
  conversationId: Joi.string().hex().length(24), // optional ObjectId
  channel: Joi.string().valid('web', 'mobile').default('web'),
});

module.exports = {
  asQueryString,
  asQueryNumber,
  escapeRegex,
  registerSchema,
  loginSchema,
  createShipmentSchema,
  saveDraftSchema,
  updateShipmentSchema,
  createVehicleSchema,
  updateVehicleSchema,
  recommendationSchema,
  chatMessageSchema,
};
