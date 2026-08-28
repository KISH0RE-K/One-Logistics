/**
 * Client-side form validation.
 *
 * This exists to give fast, specific feedback while typing - it is NOT a
 * security boundary. The Express API re-validates every field with Joi, and
 * that server-side check is the one that actually counts. The rules here are
 * deliberately kept in step with server/utils/validators.js so the two agree.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Matches the backend's generated format: UPS + 9 digits. */
const TRACKING_PATTERN = /^UPS\d{9}$/i;

export function validateEmail(value) {
  if (!value?.trim()) return 'Email is required';
  if (!EMAIL_PATTERN.test(value.trim())) return 'Enter a valid email address';
  return null;
}

export function validatePassword(value) {
  if (!value) return 'Password is required';
  // Mirrors Joi: password.min(8) on the backend.
  if (value.length < 8) return 'Password must be at least 8 characters';
  return null;
}

export function validateName(value) {
  if (!value?.trim()) return 'Name is required';
  if (value.trim().length < 2) return 'Name must be at least 2 characters';
  if (value.trim().length > 100) return 'Name cannot exceed 100 characters';
  return null;
}

export function validateRequired(value, label) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return `${label} is required`;
  }
  return null;
}

/** Positive number check, mirroring Joi's number.positive() on the backend. */
export function validatePositiveNumber(value, label) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return `${label} is required`;
  }
  const num = Number(value);
  if (!Number.isFinite(num)) return `${label} must be a number`;
  if (num <= 0) return `${label} must be greater than 0`;
  return null;
}

export function validateTrackingNumber(value) {
  if (!value?.trim()) return 'Enter a tracking number';
  if (!TRACKING_PATTERN.test(value.trim())) {
    return 'Tracking numbers look like UPS123456789';
  }
  return null;
}

/* -- Composite validators for the shipment wizard -------------------------- */

export function validatePickup(pickup) {
  const errors = {};
  const city = validateRequired(pickup?.city, 'City');
  if (city) errors.city = city;

  const line = validateRequired(pickup?.addressLine, 'Address');
  if (line) errors.addressLine = line;

  const state = validateRequired(pickup?.state, 'State');
  if (state) errors.state = state;

  const postal = validateRequired(pickup?.postalCode, 'Postal code');
  if (postal) errors.postalCode = postal;

  const contact = validateRequired(pickup?.contactName, 'Contact name');
  if (contact) errors.contactName = contact;

  const phone = validateRequired(pickup?.contactPhone, 'Contact phone');
  if (phone) errors.contactPhone = phone;
  else if (String(pickup.contactPhone).replace(/\D/g, '').length < 7) {
    errors.contactPhone = 'Enter a valid phone number';
  }

  return errors;
}

export const validateDelivery = validatePickup;

export function validatePackage(pkg) {
  const errors = {};

  const weight = validatePositiveNumber(pkg?.weight, 'Weight');
  if (weight) errors.weight = weight;

  const length = validatePositiveNumber(pkg?.length, 'Length');
  if (length) errors.length = length;

  const width = validatePositiveNumber(pkg?.width, 'Width');
  if (width) errors.width = width;

  const height = validatePositiveNumber(pkg?.height, 'Height');
  if (height) errors.height = height;

  if (!pkg?.packageType) errors.packageType = 'Choose a package type';

  return errors;
}

export function validateService(form) {
  const errors = {};
  if (!form?.deliveryOption) errors.deliveryOption = 'Choose a delivery speed';
  return errors;
}

export function validateVehicleForm(vehicle) {
  const errors = {};

  const number = validateRequired(vehicle?.vehicleNumber, 'Vehicle number');
  if (number) errors.vehicleNumber = number;

  if (!vehicle?.type) errors.type = 'Choose a vehicle type';

  const location = validateRequired(vehicle?.location, 'Location');
  if (location) errors.location = location;

  const capacity = validatePositiveNumber(vehicle?.capacityKg, 'Capacity');
  if (capacity) errors.capacityKg = capacity;

  return errors;
}

/** True when a validator result object has no entries. */
export function isClean(errors) {
  return !errors || Object.keys(errors).length === 0;
}
