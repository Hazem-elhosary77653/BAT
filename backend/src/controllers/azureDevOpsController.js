const axios = require('axios');
const pool = require('../db/connection');
const { logAuditAction } = require('../utils/audit');

const azure = axios.create({
  baseURL: process.env.AZURE_DEVOPS_BASE_URL || 'https://dev.azure.com'
});

// Configure Azure DevOps
const configureAzureDevOps = async (req, res) => {
  try {
    const { organization, project, pat } = req.body;

    // Test connection
    const auth = Buffer.from(`:${pat}`).toString('base64');
    try {
      await azure.get(`/${organization}/${project}/_apis/projects?api-version=7.0`, {
        headers: { 'Authorization': `Basic ${auth}` }
      });
    } catch (err) {
      return res.status(400).json({ error: 'Invalid Azure DevOps credentials' });
    }

    // Check if integration exists
    const existing = await pool.query(
      `SELECT * FROM azure_devops_integrations WHERE user_id = $1`,
      [req.user.id]
    );

    let result;
    if (existing.rows.length > 0) {
      result = await pool.query(
        `UPDATE azure_devops_integrations
         SET organization = $1, project = $2, pat_token_hash = $3, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $4
         RETURNING id, organization, project, is_active`,
        [organization, project, Buffer.from(pat).toString('base64'), req.user.id]
      );
    } else {
      result = await pool.query(
        `INSERT INTO azure_devops_integrations (user_id, organization, project, pat_token_hash)
         VALUES ($1, $2, $3, $4)
         RETURNING id, organization, project, is_active`,
        [req.user.id, organization, project, Buffer.from(pat).toString('base64')]
      );
    }

    await logAuditAction(req.user.id, 'AZURE_DEVOPS_CONFIGURED', 'azure_integration', result.rows[0].id);

    res.json({
      message: 'Azure DevOps configured successfully',
      integration: result.rows[0]
    });
  } catch (err) {
    console.error('Error configuring Azure DevOps:', err);
    res.status(500).json({ error: 'Failed to configure Azure DevOps' });
  }
};

// Get Azure DevOps configuration
const getAzureDevOpsConfig = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, organization, project, is_active, last_synced FROM azure_devops_integrations WHERE user_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.json(null);
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching Azure DevOps config:', err);
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
};

// Sync with Azure DevOps
const syncWithAzureDevOps = async (req, res) => {
  try {
    const config = await pool.query(
      `SELECT * FROM azure_devops_integrations WHERE user_id = $1`,
      [req.user.id]
    );

    if (config.rows.length === 0) {
      return res.status(400).json({ error: 'Azure DevOps not configured' });
    }

    const { organization, project, pat_token_hash } = config.rows[0];
    const pat = Buffer.from(pat_token_hash, 'base64').toString();
    const auth = Buffer.from(`:${pat}`).toString('base64');

    // Fetch work items from Azure DevOps
    try {
      const response = await azure.get(
        `/${organization}/${project}/_apis/wit/workitems?api-version=7.0`,
        { headers: { 'Authorization': `Basic ${auth}` } }
      );

      // Update last_synced
      await pool.query(
        `UPDATE azure_devops_integrations SET last_synced = CURRENT_TIMESTAMP WHERE user_id = $1`,
        [req.user.id]
      );

      await logAuditAction(req.user.id, 'AZURE_DEVOPS_SYNCED', 'azure_integration', config.rows[0].id);

      res.json({
        message: 'Sync completed',
        itemsCount: response.data.value.length
      });
    } catch (err) {
      res.status(400).json({ error: 'Failed to sync with Azure DevOps' });
    }
  } catch (err) {
    console.error('Error syncing with Azure DevOps:', err);
    res.status(500).json({ error: 'Sync failed' });
  }
};

module.exports = {
  configureAzureDevOps,
  getAzureDevOpsConfig,
  syncWithAzureDevOps
};
