const pool = require('../db/connection');
const { flattenRolePermissions, refreshCustomPermissions } = require('./permissionChecker');

// Sync default role permissions into the permissions table
const syncPermissions = async () => {
  const permissions = flattenRolePermissions();

  try {
    for (const perm of permissions) {
      await pool.query(
        `INSERT INTO permissions (role, action, resource)
         VALUES ($1, $2, $3)
         ON CONFLICT (role, action, resource) DO NOTHING`,
        [perm.role, perm.action, perm.resource]
      );
    }

    console.log(`[PERMISSIONS] Synced ${permissions.length} role-permission pairs`);

    // Refresh in-memory custom permissions after seeding
    await refreshCustomPermissions();
  } catch (err) {
    console.error('[PERMISSIONS] Failed to sync role permissions:', err.message);
  }
};

module.exports = {
  syncPermissions
};
