const slackService = require('../services/slackService');
const crypto = require('crypto');

/**
 * Slack Integration Controller
 * Handles Slack webhooks, commands, and interactions
 */

/**
 * Verify Slack request signature
 */
const verifySlackRequest = (req, res, next) => {
  const signature = req.headers['x-slack-signature'];
  const timestamp = req.headers['x-slack-request-timestamp'];
  const signingSecret = process.env.SLACK_SIGNING_SECRET;

  if (!signingSecret) {
    console.warn('[Slack] Signing secret not configured, skipping verification');
    return next();
  }

  if (!signature || !timestamp) {
    return res.status(401).json({ error: 'Missing signature or timestamp' });
  }

  // Prevent replay attacks
  const time = Math.floor(Date.now() / 1000);
  if (Math.abs(time - timestamp) > 60 * 5) {
    return res.status(401).json({ error: 'Request timestamp too old' });
  }

  // Verify signature
  const sigBasestring = `v0:${timestamp}:${JSON.stringify(req.body)}`;
  const mySignature = 'v0=' + crypto
    .createHmac('sha256', signingSecret)
    .update(sigBasestring, 'utf8')
    .digest('hex');

  if (crypto.timingSafeEqual(
    Buffer.from(mySignature, 'utf8'),
    Buffer.from(signature, 'utf8')
  )) {
    return next();
  }

  return res.status(401).json({ error: 'Invalid signature' });
};

/**
 * Handle Slack slash commands
 * POST /api/integrations/slack/commands
 */
const handleSlashCommand = async (req, res) => {
  try {
    const { command, text, user_id, response_url } = req.body;

    // Return immediate response
    res.status(200).json({ response_type: 'in_channel', text: 'Processing...' });

    // Process command asynchronously
    const result = await slackService.handleSlashCommand(
      command,
      text,
      user_id,
      response_url
    );

    // Send detailed response to response_url
    if (response_url) {
      const axios = require('axios');
      await axios.post(response_url, result);
    }
  } catch (error) {
    console.error('[Slack] Error handling slash command:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

/**
 * Handle Slack interactive components (buttons, menus, etc.)
 * POST /api/integrations/slack/interactions
 */
const handleInteraction = async (req, res) => {
  try {
    const payload = JSON.parse(req.body.payload);

    // Return immediate acknowledgment
    res.status(200).send();

    // Process interaction asynchronously
    await slackService.handleInteraction(payload);
  } catch (error) {
    console.error('[Slack] Error handling interaction:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

/**
 * Handle Slack events (mentions, messages, etc.)
 * POST /api/integrations/slack/events
 */
const handleEvent = async (req, res) => {
  try {
    const { type, challenge, event } = req.body;

    // URL verification challenge
    if (type === 'url_verification') {
      return res.status(200).json({ challenge });
    }

    // Acknowledge event immediately
    res.status(200).send();

    // Process event asynchronously
    if (event) {
      await processSlackEvent(event);
    }
  } catch (error) {
    console.error('[Slack] Error handling event:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

/**
 * Process Slack event
 */
const processSlackEvent = async (event) => {
  try {
    switch (event.type) {
      case 'app_mention':
        await handleAppMention(event);
        break;
      case 'message':
        await handleMessage(event);
        break;
      default:
        console.log('[Slack] Unhandled event type:', event.type);
    }
  } catch (error) {
    console.error('[Slack] Error processing event:', error);
  }
};

/**
 * Handle app mention
 */
const handleAppMention = async (event) => {
  const { channel, text, user } = event;
  
  // Process the mention and respond
  await slackService.sendMessage(
    channel,
    `Thanks for mentioning me! Use slash commands like /brd or /story to interact with the system.`
  );
};

/**
 * Handle direct message
 */
const handleMessage = async (event) => {
  // Handle direct messages if needed
  console.log('[Slack] Received message:', event);
};

/**
 * Send test notification to Slack
 * POST /api/integrations/slack/test
 */
const sendTestNotification = async (req, res) => {
  try {
    const { channel, type = 'SYSTEM_ANNOUNCEMENT' } = req.body;

    const metadata = {
      message: 'This is a test notification from the Business Analyst Assistant',
      actor_name: 'System',
      timestamp: new Date().toISOString()
    };

    const result = await slackService.sendNotification(type, metadata, channel);

    res.json({
      success: true,
      message: 'Test notification sent',
      result
    });
  } catch (error) {
    console.error('[Slack] Error sending test notification:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get Slack configuration status
 * GET /api/integrations/slack/status
 */
const getStatus = async (req, res) => {
  try {
    const status = {
      configured: !!process.env.SLACK_BOT_TOKEN,
      webhookConfigured: !!process.env.SLACK_WEBHOOK_URL,
      signingSecretConfigured: !!process.env.SLACK_SIGNING_SECRET,
      channels: {
        general: process.env.SLACK_CHANNEL_GENERAL || null,
        brds: process.env.SLACK_CHANNEL_BRDS || null,
        stories: process.env.SLACK_CHANNEL_STORIES || null
      }
    };

    res.json(status);
  } catch (error) {
    console.error('[Slack] Error getting status:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  verifySlackRequest,
  handleSlashCommand,
  handleInteraction,
  handleEvent,
  sendTestNotification,
  getStatus
};
