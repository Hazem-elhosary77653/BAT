const teamsService = require('../services/teamsService');
const crypto = require('crypto');

/**
 * Microsoft Teams Integration Controller
 * Handles Teams webhooks, bot commands, and adaptive cards
 */

/**
 * Verify Teams request (optional, based on your security setup)
 */
const verifyTeamsRequest = (req, res, next) => {
  // Teams typically uses Azure AD authentication
  // For webhook-based notifications, verification might not be needed
  // For bot framework, implement JWT validation here
  next();
};

/**
 * Handle Teams incoming webhook
 * POST /api/integrations/teams/webhook
 */
const handleWebhook = async (req, res) => {
  try {
    const { type, text, channelId } = req.body;

    res.status(200).json({ success: true });

    // Process webhook data if needed
    console.log('[Teams] Webhook received:', { type, text, channelId });
  } catch (error) {
    console.error('[Teams] Error handling webhook:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Handle Teams bot messages
 * POST /api/integrations/teams/messages
 */
const handleBotMessage = async (req, res) => {
  try {
    const { type, text, from, conversation } = req.body;

    // Return immediate acknowledgment
    res.status(200).json({
      type: 'message',
      text: 'Processing your request...'
    });

    // Process command asynchronously
    if (text) {
      const parts = text.trim().split(' ');
      const command = parts[0].toLowerCase();
      const remainingText = parts.slice(1).join(' ');

      const result = await teamsService.handleBotCommand(
        command,
        remainingText,
        from?.id
      );

      // Send result back to Teams
      // This would typically use the Bot Framework SDK
      console.log('[Teams] Bot response:', result);
    }
  } catch (error) {
    console.error('[Teams] Error handling bot message:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

/**
 * Handle Teams card actions
 * POST /api/integrations/teams/actions
 */
const handleCardAction = async (req, res) => {
  try {
    const { action, data, user } = req.body;

    // Return immediate acknowledgment
    res.status(200).send();

    // Process action
    switch (action) {
      case 'approve_brd':
        await handleBRDApproval(data.brdId, user?.id);
        break;
      case 'review_brd':
        await handleBRDReview(data.brdId, user?.id);
        break;
      case 'accept_story':
        await handleStoryAccept(data.storyId, user?.id);
        break;
      default:
        console.log('[Teams] Unknown action:', action);
    }
  } catch (error) {
    console.error('[Teams] Error handling card action:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

/**
 * Handle BRD approval action
 */
const handleBRDApproval = async (brdId, userId) => {
  // This would integrate with your BRD approval workflow
  console.log('[Teams] BRD approval requested:', { brdId, userId });
};

/**
 * Handle BRD review action
 */
const handleBRDReview = async (brdId, userId) => {
  console.log('[Teams] BRD review requested:', { brdId, userId });
};

/**
 * Handle story acceptance
 */
const handleStoryAccept = async (storyId, userId) => {
  console.log('[Teams] Story acceptance:', { storyId, userId });
};

/**
 * Search from Teams
 * POST /api/integrations/teams/search
 */
const handleSearch = async (req, res) => {
  try {
    const { query, userId } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const result = await teamsService.handleSearch(query, userId);

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('[Teams] Error handling search:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Send test notification to Teams
 * POST /api/integrations/teams/test
 */
const sendTestNotification = async (req, res) => {
  try {
    const { webhook, type = 'SYSTEM_ANNOUNCEMENT' } = req.body;

    const metadata = {
      message: 'This is a test notification from the Business Analyst Assistant',
      actor_name: 'System',
      timestamp: new Date().toISOString()
    };

    const result = await teamsService.sendNotification(type, metadata, webhook);

    res.json({
      success: true,
      message: 'Test notification sent',
      result
    });
  } catch (error) {
    console.error('[Teams] Error sending test notification:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get Teams configuration status
 * GET /api/integrations/teams/status
 */
const getStatus = async (req, res) => {
  try {
    const status = {
      configured: !!process.env.TEAMS_WEBHOOK_URL,
      botConfigured: !!process.env.TEAMS_BOT_APP_ID,
      tenantId: process.env.TEAMS_TENANT_ID || null,
      webhookUrl: process.env.TEAMS_WEBHOOK_URL ? 'Configured' : 'Not configured'
    };

    res.json(status);
  } catch (error) {
    console.error('[Teams] Error getting status:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get Teams tab configuration
 * GET /api/integrations/teams/tab/config
 */
const getTabConfig = async (req, res) => {
  try {
    const config = {
      contentUrl: `${process.env.FRONTEND_URL}/teams/tab`,
      websiteUrl: process.env.FRONTEND_URL,
      entityId: 'baa-teams-tab',
      suggestedDisplayName: 'Business Analyst Assistant'
    };

    res.json(config);
  } catch (error) {
    console.error('[Teams] Error getting tab config:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Handle Teams compose extension query
 * POST /api/integrations/teams/compose-extension/query
 */
const handleComposeExtensionQuery = async (req, res) => {
  try {
    const { parameters } = req.body;
    const query = parameters?.find(p => p.name === 'search')?.value || '';

    const results = await teamsService.handleSearch(query, null);

    res.json({
      composeExtension: {
        type: 'result',
        attachmentLayout: 'list',
        attachments: results
      }
    });
  } catch (error) {
    console.error('[Teams] Error handling compose extension:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  verifyTeamsRequest,
  handleWebhook,
  handleBotMessage,
  handleCardAction,
  handleSearch,
  sendTestNotification,
  getStatus,
  getTabConfig,
  handleComposeExtensionQuery
};
