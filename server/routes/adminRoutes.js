const router = require('express').Router();
const {
  getDashboard,
  getAuditLogs,
  getVehicles,
  createVehicle,
  updateVehicle,
} = require('../controllers/adminController');
const { authenticateUser } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const { validate } = require('../middleware/validate');
const { createVehicleSchema, updateVehicleSchema } = require('../utils/validators');

// All admin routes require JWT + admin role
router.use(authenticateUser, requireAdmin);

/**
 * @openapi
 * /api/admin/dashboard:
 *   get:
 *     tags: [Admin]
 *     summary: Aggregated dashboard metrics
 *     security:
 *       - bearerAuth: []
 */
router.get('/dashboard', getDashboard);

/**
 * @openapi
 * /api/admin/audit-logs:
 *   get:
 *     tags: [Admin]
 *     summary: Paginated audit log viewer
 *     security:
 *       - bearerAuth: []
 */
router.get('/audit-logs', getAuditLogs);

/**
 * @openapi
 * /api/admin/vehicles:
 *   get:
 *     tags: [Admin]
 *     summary: Get all vehicles
 *     security:
 *       - bearerAuth: []
 *   post:
 *     tags: [Admin]
 *     summary: Create a vehicle
 *     security:
 *       - bearerAuth: []
 */
router.get('/vehicles', getVehicles);
router.post('/vehicles', validate(createVehicleSchema), createVehicle);

/**
 * @openapi
 * /api/admin/vehicles/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Update a vehicle
 *     security:
 *       - bearerAuth: []
 */
router.put('/vehicles/:id', validate(updateVehicleSchema), updateVehicle);

module.exports = router;
