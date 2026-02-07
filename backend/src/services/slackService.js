const axios = require('axios');
const { sqlite: db } = require('../db/connection');

/**
 * Slack Integration Service
 * Handles Slack notifications, commands, and interactions
 */

class SlackService {
  constructor() {
    this.botToken = process.env.SLACK_BOT_TOKEN;
    this.signingSecret = process.env.SLACK_SIGNING_SECRET;
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL;
    this.apiUrl = 'https://slack.com/api';
  }

  /**
   * Send message to Slack channel
   */
  async sendMessage(channel, text, blocks = null) {
    try {
      if (!this.botToken) {
        console.warn('[SlackService] Bot token not configured');
        return null;
      }

      const payload = {
        channel,
        text,
        ...(blocks && { blocks })
      };

      const response = await axios.post(
        `${this.apiUrl}/chat.postMessage`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.botToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('[SlackService] Error sending message:', error.message);
      throw error;
    }
  }

  /**
   * Send notification to Slack channel
   */
  async sendNotification(type, metadata, channelId) {
    try {
      const blocks = this.buildNotificationBlocks(type, metadata);
      const text = this.buildNotificationText(type, metadata);

      return await this.sendMessage(channelId, text, blocks);
    } catch (error) {
      console.error('[SlackService] Error sending notification:', error.message);
    }
  }

  /**
   * Build Slack blocks for notification
   */
  buildNotificationBlocks(type, metadata) {
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: this.getNotificationTitle(type)
        }
      }
    ];

    // Add content based on notification type
    switch (type) {
      case 'BRD_CREATED':
        blocks.push({
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*BRD:*\n${metadata.brd_title}`
            },
            {
              type: 'mrkdwn',
              text: `*Created by:*\n${metadata.actor_name}`
            }
          ]
        });
        if (metadata.brd_id) {
          blocks.push({
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'View BRD'
                },
                url: `${process.env.FRONTEND_URL}/brds/${metadata.brd_id}`,
                style: 'primary'
              },
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Approve'
                },
                action_id: `approve_brd_${metadata.brd_id}`,
                style: 'primary'
              },
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Request Changes'
                },
                action_id: `request_changes_${metadata.brd_id}`,
                style: 'danger'
              }
            ]
          });
        }
        break;

      case 'STORY_ASSIGNED':
        blocks.push({
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Story:*\n${metadata.story_title}`
            },
            {
              type: 'mrkdwn',
              text: `*Assigned to:*\n${metadata.assignee_name}`
            },
            {
              type: 'mrkdwn',
              text: `*Priority:*\n${metadata.priority || 'Medium'}`
            }
          ]
        });
        if (metadata.story_id) {
          blocks.push({
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'View Story'
                },
                url: `${process.env.FRONTEND_URL}/stories/${metadata.story_id}`,
                style: 'primary'
              }
            ]
          });
        }
        break;

      case 'COMMENT_ADDED':
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Comment by ${metadata.actor_name}:*\n${metadata.comment_text}`
          }
        });
        break;

      default:
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: metadata.message || 'New notification'
          }
        });
    }

    // Add divider
    blocks.push({ type: 'divider' });

    return blocks;
  }

  /**
   * Build plain text for notification
   */
  buildNotificationText(type, metadata) {
    switch (type) {
      case 'BRD_CREATED':
        return `📄 New BRD created: ${metadata.brd_title} by ${metadata.actor_name}`;
      case 'STORY_ASSIGNED':
        return `📋 Story assigned: ${metadata.story_title} to ${metadata.assignee_name}`;
      case 'COMMENT_ADDED':
        return `💬 New comment by ${metadata.actor_name}`;
      default:
        return metadata.message || 'New notification';
    }
  }

  /**
   * Get notification title
   */
  getNotificationTitle(type) {
    const titles = {
      BRD_CREATED: '📄 New BRD Created',
      BRD_UPDATED: '📝 BRD Updated',
      BRD_APPROVED: '✅ BRD Approved',
      STORY_CREATED: '📋 New Story Created',
      STORY_ASSIGNED: '👤 Story Assigned',
      STORY_STATUS_CHANGED: '🔄 Story Status Changed',
      COMMENT_ADDED: '💬 New Comment',
      MENTION: '👋 You were mentioned',
      SYSTEM_ANNOUNCEMENT: '📢 System Announcement'
    };
    return titles[type] || '🔔 Notification';
  }

  /**
   * Handle Slack slash commands
   */
  async handleSlashCommand(command, text, userId, responseUrl) {
    try {
      const parts = text.trim().split(' ');
      const action = parts[0];

      switch (command) {
        case '/brd':
          return await this.handleBRDCommand(action, parts.slice(1), userId, responseUrl);
        case '/story':
          return await this.handleStoryCommand(action, parts.slice(1), userId, responseUrl);
        default:
          return {
            response_type: 'ephemeral',
            text: `Unknown command: ${command}`
          };
      }
    } catch (error) {
      console.error('[SlackService] Error handling command:', error);
      return {
        response_type: 'ephemeral',
        text: `Error: ${error.message}`
      };
    }
  }

  /**
   * Handle /brd commands
   */
  async handleBRDCommand(action, args, userId, responseUrl) {
    switch (action) {
      case 'create':
        return {
          response_type: 'ephemeral',
          text: '📄 To create a BRD, please use the web interface.',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '📄 *Create a new BRD*\nPlease use the web interface to create a new BRD with all the required fields.'
              },
              accessory: {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Open BRD Creator'
                },
                url: `${process.env.FRONTEND_URL}/brds/new`,
                style: 'primary'
              }
            }
          ]
        };

      case 'list':
        const brds = db.prepare(`
          SELECT id, title, status, created_at
          FROM brds
          ORDER BY created_at DESC
          LIMIT 5
        `).all();

        const brdBlocks = [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '📄 Recent BRDs'
            }
          }
        ];

        brds.forEach(brd => {
          brdBlocks.push({
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${brd.title}*\nStatus: ${brd.status}`
            },
            accessory: {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View'
              },
              url: `${process.env.FRONTEND_URL}/brds/${brd.id}`
            }
          });
        });

        return {
          response_type: 'ephemeral',
          blocks: brdBlocks
        };

      default:
        return {
          response_type: 'ephemeral',
          text: 'Available commands:\n• `/brd create` - Create new BRD\n• `/brd list` - List recent BRDs'
        };
    }
  }

  /**
   * Handle /story commands
   */
  async handleStoryCommand(action, args, userId, responseUrl) {
    switch (action) {
      case 'list':
        const stories = db.prepare(`
          SELECT id, title, status, priority
          FROM stories
          ORDER BY created_at DESC
          LIMIT 5
        `).all();

        const storyBlocks = [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '📋 Recent Stories'
            }
          }
        ];

        stories.forEach(story => {
          storyBlocks.push({
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${story.title}*\nStatus: ${story.status} | Priority: ${story.priority}`
            },
            accessory: {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View'
              },
              url: `${process.env.FRONTEND_URL}/stories/${story.id}`
            }
          });
        });

        return {
          response_type: 'ephemeral',
          blocks: storyBlocks
        };

      default:
        return {
          response_type: 'ephemeral',
          text: 'Available commands:\n• `/story list` - List recent stories'
        };
    }
  }

  /**
   * Handle interactive actions (buttons, etc.)
   */
  async handleInteraction(payload) {
    try {
      const { type, actions, user } = payload;

      if (type === 'block_actions' && actions && actions.length > 0) {
        const action = actions[0];
        const actionId = action.action_id;

        // Handle BRD approval
        if (actionId.startsWith('approve_brd_')) {
          const brdId = actionId.replace('approve_brd_', '');
          return await this.handleBRDApproval(brdId, user.id);
        }

        // Handle request changes
        if (actionId.startsWith('request_changes_')) {
          const brdId = actionId.replace('request_changes_', '');
          return await this.handleRequestChanges(brdId, user.id);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('[SlackService] Error handling interaction:', error);
      throw error;
    }
  }

  /**
   * Handle BRD approval from Slack
   */
  async handleBRDApproval(brdId, slackUserId) {
    // This would need to map Slack user to system user
    // and update the BRD status
    return {
      response_type: 'ephemeral',
      text: '✅ BRD approval request submitted. Please approve through the web interface for full audit trail.'
    };
  }

  /**
   * Handle request changes from Slack
   */
  async handleRequestChanges(brdId, slackUserId) {
    return {
      response_type: 'ephemeral',
      text: '📝 Please add your change requests through the web interface.'
    };
  }

  /**
   * Get user's Slack ID from database
   */
  getUserSlackId(userId) {
    try {
      const result = db.prepare(
        'SELECT slack_user_id FROM users WHERE id = ?'
      ).get(userId);
      return result?.slack_user_id;
    } catch (error) {
      console.error('[SlackService] Error getting Slack ID:', error);
      return null;
    }
  }

  /**
   * Get channel for notification type
   */
  getNotificationChannel(type) {
    // This could be configured per workspace/team
    const channels = {
      BRD_CREATED: process.env.SLACK_CHANNEL_BRDS,
      BRD_APPROVED: process.env.SLACK_CHANNEL_BRDS,
      STORY_CREATED: process.env.SLACK_CHANNEL_STORIES,
      STORY_ASSIGNED: process.env.SLACK_CHANNEL_STORIES,
      SYSTEM_ANNOUNCEMENT: process.env.SLACK_CHANNEL_GENERAL
    };
    return channels[type] || process.env.SLACK_CHANNEL_GENERAL;
  }
}

module.exports = new SlackService();
