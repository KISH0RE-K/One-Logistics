import api, { unwrap, getChannel } from './axios';

/**
 * Shipments, drafts and public tracking.
 *
 * Backend contract (server/routes/shipmentRoutes.js, trackingRoutes.js):
 *   POST   /api/shipments          -> 201 { shipment }   (confirmed booking)
 *   GET    /api/shipments          -> { shipments, count }
 *   GET    /api/shipments/:id      -> { shipment }
 *   PUT    /api/shipments/:id      -> { shipment }
 *   DELETE /api/shipments/:id      -> cancels a booking, deletes a draft
 *   POST   /api/shipments/draft    -> 201 { draft }
 *   GET    /api/shipments/drafts   -> { drafts, count }
 *   GET    /api/tracking/:number   -> public, no auth
 *
 * The shipment's owner is always taken from the JWT server-side; userId is
 * never sent from here.
 */

/* ===========================================================================
 * ADDRESS FIELDS THAT THE CURRENT BACKEND DOES NOT STORE
 * ===========================================================================
 * The Mongoose shipment schema models origin and destination as two plain
 * city strings (`from`, `to`), and its Joi validators run with
 * allowUnknown:false - so any extra key makes the whole request fail with 400.
 *
 * The wizard still collects a full address because that is the real-world
 * flow, but only the city survives the trip to the API. Street line, state,
 * postal code and contact details are used for on-screen review and are then
 * dropped HERE, in one place, rather than being silently scattered.
 *
 * Consequence to be aware of: a draft resumed later (including on another
 * device) comes back with city, package, service and mode intact, but its
 * street/contact fields blank.
 *
 * To persist them, add optional `pickupAddress` / `deliveryAddress`
 * sub-objects to server/models/Shipment.js and to the Joi schemas in
 * server/utils/validators.js, then include them in buildLocationPayload
 * below. Nothing else in the frontend needs to change.
 * ======================================================================== */

/** Fields the backend accepts for a location. Everything else is dropped. */
function buildLocationPayload(location) {
  return location?.city?.trim() || undefined;
}

const PACKAGE_TYPES = ['document', 'parcel', 'fragile', 'electronics', 'other'];

/**
 * Only send package keys the backend knows, and only when they have values.
 *
 * IMPORTANT - why a half-filled package is never sent, even on a draft:
 * the Joi validators accept a partial package on POST /shipments/draft and
 * PUT /shipments/:id, but the Mongoose PackageDetail model marks weight,
 * height, width, length and packageType as `required`. So a package document
 * with only some of those fields is rejected at the model layer with a 400,
 * whatever Joi allowed. Sending nothing is the only thing the backend
 * actually accepts for an incomplete package, and it costs the customer
 * nothing: the draft still saves its route, service and transport, and the
 * package attaches as soon as all five fields are filled in.
 *
 * If the model is ever relaxed to allow partial package documents, drop the
 * `isComplete` guard below and partial packages will start persisting.
 */
function buildPackagePayload(pkg, { partial = false } = {}) {
  if (!pkg) return undefined;

  const out = {};
  for (const key of ['weight', 'height', 'width', 'length']) {
    const raw = pkg[key];
    if (raw === undefined || raw === null || raw === '') continue;
    const num = Number(raw);
    if (Number.isFinite(num)) out[key] = num;
  }
  if (pkg.packageType && PACKAGE_TYPES.includes(pkg.packageType)) {
    out.packageType = pkg.packageType;
  }
  if (typeof pkg.fragile === 'boolean') out.fragile = pkg.fragile;

  const isComplete = Boolean(
    out.weight && out.height && out.width && out.length && out.packageType
  );

  // Drafts: send the package only once the model would accept it.
  if (partial) return isComplete ? out : undefined;

  // Confirmed shipments: send what we have and let the caller's own
  // validation (which runs first) surface any gap.
  return out;
}

/** Strip undefined keys so allowUnknown:false never sees a stray null. */
function compact(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
}

/* ---------------------------------------------------------------------------
 * Create / update
 * ------------------------------------------------------------------------ */

/**
 * Create a confirmed shipment. The backend generates the tracking number,
 * sets status to 'booked' and writes the first timeline event.
 */
export async function createShipment(form) {
  const body = compact({
    from: buildLocationPayload(form.pickup),
    to: buildLocationPayload(form.delivery),
    deliveryOption: form.deliveryOption,
    transportMode: form.transportMode,
    cost: form.cost !== undefined ? Number(form.cost) : undefined,
    estimatedTime:
      form.estimatedTime !== undefined ? Number(form.estimatedTime) : undefined,
    channel: getChannel(),
  });
  body.package = buildPackagePayload(form.package);

  const res = await api.post('/shipments', body);
  return unwrap(res)?.shipment ?? null;
}

/** Save partial progress as a draft (status: 'draft', no tracking number). */
export async function saveDraft(form) {
  const body = compact({
    from: buildLocationPayload(form.pickup),
    to: buildLocationPayload(form.delivery),
    deliveryOption: form.deliveryOption,
    transportMode: form.transportMode,
    cost: form.cost !== undefined ? Number(form.cost) : undefined,
    estimatedTime:
      form.estimatedTime !== undefined ? Number(form.estimatedTime) : undefined,
    channel: getChannel(),
  });
  const pkg = buildPackagePayload(form.package, { partial: true });
  if (pkg) body.package = pkg;

  const res = await api.post('/shipments/draft', body);
  return unwrap(res)?.draft ?? null;
}

/**
 * Update an existing shipment or draft.
 * Passing status:'booked' on a draft promotes it: the backend generates the
 * tracking number and appends the 'Booked' event.
 */
export async function updateShipment(id, form) {
  const body = compact({
    from: buildLocationPayload(form.pickup),
    to: buildLocationPayload(form.delivery),
    deliveryOption: form.deliveryOption,
    transportMode: form.transportMode,
    cost: form.cost !== undefined ? Number(form.cost) : undefined,
    estimatedTime:
      form.estimatedTime !== undefined ? Number(form.estimatedTime) : undefined,
    status: form.status,
    channel: getChannel(),
  });
  const pkg = buildPackagePayload(form.package, { partial: true });
  if (pkg) body.package = pkg;

  const res = await api.put(`/shipments/${id}`, body);
  return unwrap(res)?.shipment ?? null;
}

/** Promote a saved draft into a confirmed booking. */
export function confirmDraft(id, form) {
  return updateShipment(id, { ...form, status: 'booked' });
}

/* ---------------------------------------------------------------------------
 * Read
 * ------------------------------------------------------------------------ */

/** Confirmed shipments for the signed-in user. Drafts are never included. */
export async function getShipments({ status, active } = {}) {
  const params = {};
  if (active) params.active = 'true';
  else if (status) params.status = status;

  const res = await api.get('/shipments', { params });
  return unwrap(res)?.shipments ?? [];
}

export function getActiveShipments() {
  return getShipments({ active: true });
}

export async function getDrafts() {
  const res = await api.get('/shipments/drafts');
  return unwrap(res)?.drafts ?? [];
}

export async function getShipment(id) {
  const res = await api.get(`/shipments/${id}`);
  return unwrap(res)?.shipment ?? null;
}

/* ---------------------------------------------------------------------------
 * Delete / cancel
 *
 * One endpoint, two behaviours, decided by the backend: a draft is removed
 * outright, a confirmed shipment is cancelled and keeps its audit trail.
 * ------------------------------------------------------------------------ */

export async function deleteShipment(id) {
  const res = await api.delete(`/shipments/${id}`);
  const data = unwrap(res);
  return {
    deleted: Boolean(data?.message),
    shipment: data?.shipment ?? null,
  };
}

/* ---------------------------------------------------------------------------
 * Public tracking - the only endpoint that needs no token
 * ------------------------------------------------------------------------ */

export async function trackShipment(trackingNumber) {
  const res = await api.get(`/tracking/${encodeURIComponent(trackingNumber)}`);
  return unwrap(res);
}
