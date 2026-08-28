const router = require('express').Router();
const { getTrackingInfo } = require('../controllers/shipmentController');

/**
 * @openapi
 * /api/tracking/{trackingNumber}:
 *   get:
 *     tags: [Tracking]
 *     summary: Public shipment tracking by tracking number
 *     parameters:
 *       - in: path
 *         name: trackingNumber
 *         required: true
 *         schema:
 *           type: string
 *           example: UPS123456789
 *     responses:
 *       200:
 *         description: Tracking information with event timeline
 *       404:
 *         description: Tracking number not found
 */
router.get('/:trackingNumber', getTrackingInfo);

module.exports = router;
