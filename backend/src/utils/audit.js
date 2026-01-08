const pool = require('../db/connection');

const logAuditAction = async (userId, action, entityType, entityId, oldValues = null, newValues = null, ipAddress = null) => {
  try {
    console.log('[AUDIT] Logging action:', action, 'for user:', userId);
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, action, entityType, entityId, JSON.stringify(oldValues), JSON.stringify(newValues), ipAddress]
    );
    console.log('[AUDIT] Action logged successfully');
  } catch (err) {
    console.error('[AUDIT] Error logging audit action:', err.message);
    console.error('[AUDIT] Stack:', err.stack);
    throw err;
  }
};

module.exports = {
  logAuditAction
};
