const router = require('express').Router();
const { getAvailableVehicles } = require('../controllers/vehicleController');
const { authenticateUser } = require('../middleware/auth');

/**
 * @openapi
 * /api/vehicles/available:
 *   get:
 *     tags: [Vehicles]
 *     summary: Get available vehicles matching location and weight capacity
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: location
 *         schema: { type: string, example: Chennai }
 *       - in: query
 *         name: weight
 *         schema: { type: number, example: 500 }
 *     responses:
 *       200:
 *         description: List of available vehicles
 */
router.get('/available', authenticateUser, getAvailableVehicles);

module.exports = router;
