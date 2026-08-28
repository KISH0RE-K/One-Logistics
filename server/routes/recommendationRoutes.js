const router = require('express').Router();
const { getRecommendation } = require('../controllers/recommendationController');
const { authenticateUser } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { recommendationSchema } = require('../utils/validators');

/**
 * @openapi
 * /api/recommendation:
 *   post:
 *     tags: [Recommendation]
 *     summary: Get ML-powered shipping mode recommendation
 *     description: Proxies the request to the Python/FastAPI ML service. Returns recommended transport mode with cost and time options.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [from, to, weight, height, width, length, deliveryOption, packageType]
 *             properties:
 *               from: { type: string, example: Chennai }
 *               to: { type: string, example: Mumbai }
 *               weight: { type: number, example: 5 }
 *               height: { type: number, example: 15 }
 *               width: { type: number, example: 20 }
 *               length: { type: number, example: 30 }
 *               deliveryOption: { type: string, enum: [Economy, Normal, Express] }
 *               packageType: { type: string, enum: [document, parcel, fragile, electronics, other] }
 *     responses:
 *       200:
 *         description: ML recommendation result
 *       503:
 *         description: ML service unavailable
 *       504:
 *         description: ML service timed out
 */
router.post('/', authenticateUser, validate(recommendationSchema), getRecommendation);

module.exports = router;
