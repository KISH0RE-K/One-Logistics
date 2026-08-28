const router = require('express').Router();
const {
  createShipment,
  getShipments,
  getShipment,
  updateShipment,
  deleteShipment,
  saveDraft,
  getDrafts,
} = require('../controllers/shipmentController');
const { authenticateUser } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createShipmentSchema, saveDraftSchema, updateShipmentSchema } = require('../utils/validators');

router.use(authenticateUser);

// IMPORTANT: specific routes must come BEFORE /:id

/**
 * @openapi
 * /api/shipments/draft:
 *   post:
 *     tags: [Shipments]
 *     summary: Save a shipment as a draft
 *     security:
 *       - bearerAuth: []
 */
router.post('/draft', validate(saveDraftSchema), saveDraft);

/**
 * @openapi
 * /api/shipments/drafts:
 *   get:
 *     tags: [Shipments]
 *     summary: Get all saved drafts for the authenticated user
 *     security:
 *       - bearerAuth: []
 */
router.get('/drafts', getDrafts);

/**
 * @openapi
 * /api/shipments:
 *   post:
 *     tags: [Shipments]
 *     summary: Create a confirmed shipment
 *     security:
 *       - bearerAuth: []
 *   get:
 *     tags: [Shipments]
 *     summary: List authenticated user's shipments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [booked, in_transit, out_for_delivery, delivered, cancelled]
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 */
router.post('/', validate(createShipmentSchema), createShipment);
router.get('/', getShipments);

/**
 * @openapi
 * /api/shipments/{id}:
 *   get:
 *     tags: [Shipments]
 *     summary: Get a single shipment by ID
 *     security:
 *       - bearerAuth: []
 *   put:
 *     tags: [Shipments]
 *     summary: Update a shipment (or promote draft to booked)
 *     security:
 *       - bearerAuth: []
 *   delete:
 *     tags: [Shipments]
 *     summary: Cancel a confirmed shipment or delete a draft
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', getShipment);
router.put('/:id', validate(updateShipmentSchema), updateShipment);
router.delete('/:id', deleteShipment);

module.exports = router;
