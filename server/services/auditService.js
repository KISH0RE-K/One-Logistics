const AuditLog = require('../models/AuditLog');

/**
 * Audit service — write audit logs without blocking the main request flow.
 * Errors are swallowed and logged to console.
 */
const auditService = {
  /**
   * @param {Object} params
   * @param {string} params.userId
   * @param {string} params.action   - one of AUDIT_ACTIONS
   * @param {string} params.resource - e.g. 'shipment', 'vehicle'
   * @param {*}      [params.resourceId]
   * @param {Object} [params.metadata]
   */
  async log({ userId, action, resource, resourceId = null, metadata = {} }) {
    try {
      await AuditLog.create({ userId, action, resource, resourceId, metadata });
    } catch (err) {
      console.error('[AuditService] Failed to write audit log:', err.message);
    }
  },
};

module.exports = auditService;
