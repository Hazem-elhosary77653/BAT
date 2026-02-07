const axios = require('axios');
const { sqlite: db } = require('../db/connection');

/**
 * Microsoft Teams Integration Service
 * Handles Teams notifications, adaptive cards, and bot interactions
 */

class TeamsService {
  constructor() {
    this.webhookUrl = process.env.TEAMS_WEBHOOK_URL;
    this.botAppId = process.env.TEAMS_BOT_APP_ID;
    this.botPassword = process.env.TEAMS_BOT_PASSWORD;
    this.tenantId = process.env.TEAMS_TENANT_ID;
  }

  /**
   * Send message to Teams channel via webhook
   */
  async sendMessage(text, card = null) {
    try {
      if (!this.webhookUrl) {
        console.warn('[TeamsService] Webhook URL not configured');
        return null;
      }

      const payload = card || {
        '@type': 'MessageCard',
        '@context': 'https://schema.org/extensions',
        text
      };

      const response = await axios.post(this.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('[TeamsService] Error sending message:', error.message);
      throw error;
    }
  }

  /**
   * Send notification to Teams channel
   */
  async sendNotification(type, metadata, channelWebhook = null) {
    try {
      const card = this.buildAdaptiveCard(type, metadata);
      const webhook = channelWebhook || this.webhookUrl;

      if (!webhook) {
        console.warn('[TeamsService] No webhook URL available');
        return null;
      }

      const response = await axios.post(webhook, card, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('[TeamsService] Error sending notification:', error.message);
    }
  }

  /**
   * Build Adaptive Card for notification
   */
  buildAdaptiveCard(type, metadata) {
    const card = {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard',
            version: '1.4',
            body: []
          }
        }
      ]
    };

    const body = card.attachments[0].content.body;

    // Add header
    body.push({
      type: 'TextBlock',
      text: this.getNotificationTitle(type),
      weight: 'Bolder',
      size: 'Large',
      color: this.getNotificationColor(type)
    });

    // Add content based on notification type
    switch (type) {
      case 'BRD_CREATED':
        body.push(
          {
            type: 'FactSet',
            facts: [
              {
                title: 'BRD Title:',
                value: metadata.brd_title || 'N/A'
              },
              {
                title: 'Created by:',
                value: metadata.actor_name || 'Unknown'
              },
              {
                title: 'Status:',
                value: metadata.status || 'Draft'
              },
              {
                title: 'Created:',
                value: metadata.created_at || new Date().toISOString()
              }
            ]
          }
        );

        if (metadata.brd_description) {
          body.push({
            type: 'TextBlock',
            text: metadata.brd_description,
            wrap: true,
            maxLines: 3
          });
        }

        // Add actions
        card.attachments[0].content.actions = [
          {
            type: 'Action.OpenUrl',
            title: 'View BRD',
            url: `${process.env.FRONTEND_URL}/brds/${metadata.brd_id}`,
            style: 'positive'
          },
          {
            type: 'Action.OpenUrl',
            title: 'Review',
            url: `${process.env.FRONTEND_URL}/brds/${metadata.brd_id}/review`
          }
        ];
        break;

      case 'BRD_APPROVED':
        body.push(
          {
            type: 'FactSet',
            facts: [
              {
                title: 'BRD:',
                value: metadata.brd_title || 'N/A'
              },
              {
                title: 'Approved by:',
                value: metadata.actor_name || 'Unknown'
              },
              {
                title: 'Approval Date:',
                value: new Date().toLocaleDateString()
              }
            ]
          }
        );

        card.attachments[0].content.actions = [
          {
            type: 'Action.OpenUrl',
            title: 'View BRD',
            url: `${process.env.FRONTEND_URL}/brds/${metadata.brd_id}`
          }
        ];
        break;

      case 'STORY_ASSIGNED':
        body.push(
          {
            type: 'FactSet',
            facts: [
              {
                title: 'Story:',
                value: metadata.story_title || 'N/A'
              },
              {
                title: 'Assigned to:',
                value: metadata.assignee_name || 'Unknown'
              },
              {
                title: 'Priority:',
                value: metadata.priority || 'Medium'
              },
              {
                title: 'Status:',
                value: metadata.status || 'New'
              }
            ]
          }
        );

        if (metadata.story_description) {
          body.push({
            type: 'TextBlock',
            text: metadata.story_description,
            wrap: true,
            maxLines: 3
          });
        }

        card.attachments[0].content.actions = [
          {
            type: 'Action.OpenUrl',
            title: 'View Story',
            url: `${process.env.FRONTEND_URL}/stories/${metadata.story_id}`,
            style: 'positive'
          },
          {
            type: 'Action.OpenUrl',
            title: 'Accept Task',
            url: `${process.env.FRONTEND_URL}/stories/${metadata.story_id}/accept`
          }
        ];
        break;

      case 'STORY_STATUS_CHANGED':
        body.push(
          {
            type: 'FactSet',
            facts: [
              {
                title: 'Story:',
                value: metadata.story_title || 'N/A'
              },
              {
                title: 'Previous Status:',
                value: metadata.old_status || 'Unknown'
              },
              {
                title: 'New Status:',
                value: metadata.new_status || 'Unknown'
              },
              {
                title: 'Updated by:',
                value: metadata.actor_name || 'Unknown'
              }
            ]
          }
        );

        card.attachments[0].content.actions = [
          {
            type: 'Action.OpenUrl',
            title: 'View Story',
            url: `${process.env.FRONTEND_URL}/stories/${metadata.story_id}`
          }
        ];
        break;

      case 'COMMENT_ADDED':
        body.push(
          {
            type: 'TextBlock',
            text: `**Comment by ${metadata.actor_name}:**`,
            weight: 'Bolder'
          },
          {
            type: 'TextBlock',
            text: metadata.comment_text || 'No comment text',
            wrap: true,
            isSubtle: true
          }
        );

        if (metadata.resource_type && metadata.resource_id) {
          card.attachments[0].content.actions = [
            {
              type: 'Action.OpenUrl',
              title: 'View',
              url: `${process.env.FRONTEND_URL}/${metadata.resource_type}s/${metadata.resource_id}`
            }
          ];
        }
        break;

      case 'MENTION':
        body.push(
          {
            type: 'TextBlock',
            text: `${metadata.actor_name} mentioned you in ${metadata.resource_type || 'a comment'}`,
            wrap: true
          }
        );

        if (metadata.comment_text) {
          body.push({
            type: 'TextBlock',
            text: `"${metadata.comment_text}"`,
            wrap: true,
            isSubtle: true,
            style: 'italic'
          });
        }

        if (metadata.resource_id) {
          card.attachments[0].content.actions = [
            {
              type: 'Action.OpenUrl',
              title: 'View Context',
              url: `${process.env.FRONTEND_URL}/${metadata.resource_type}s/${metadata.resource_id}`
            }
          ];
        }
        break;

      case 'SYSTEM_ANNOUNCEMENT':
        body.push({
          type: 'TextBlock',
          text: metadata.message || 'System announcement',
          wrap: true
        });
        break;

      default:
        body.push({
          type: 'TextBlock',
          text: metadata.message || 'New notification',
          wrap: true
        });
    }

    // Add separator
    body.push({
      type: 'TextBlock',
      text: '',
      separator: true
    });

    // Add footer
    body.push({
      type: 'TextBlock',
      text: `🕒 ${new Date().toLocaleString()}`,
      size: 'Small',
      isSubtle: true
    });

    return card;
  }

  /**
   * Get notification title
   */
  getNotificationTitle(type) {
    const titles = {
      BRD_CREATED: '📄 New BRD Created',
      BRD_UPDATED: '📝 BRD Updated',
      BRD_APPROVED: '✅ BRD Approved',
      BRD_REJECTED: '❌ BRD Rejected',
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
   * Get notification color
   */
  getNotificationColor(type) {
    const colors = {
      BRD_CREATED: 'Accent',
      BRD_APPROVED: 'Good',
      BRD_REJECTED: 'Attention',
      STORY_ASSIGNED: 'Accent',
      SYSTEM_ANNOUNCEMENT: 'Warning'
    };
    return colors[type] || 'Default';
  }

  /**
   * Build search results card
   */
  buildSearchResultsCard(query, results) {
    const card = {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard',
            version: '1.4',
            body: [
              {
                type: 'TextBlock',
                text: `🔍 Search Results for "${query}"`,
                weight: 'Bolder',
                size: 'Large'
              },
              {
                type: 'TextBlock',
                text: `Found ${results.length} result(s)`,
                isSubtle: true,
                spacing: 'None'
              }
            ]
          }
        }
      ]
    };

    const body = card.attachments[0].content.body;

    results.forEach((result, index) => {
      if (index < 5) { // Limit to 5 results
        body.push(
          {
            type: 'Container',
            separator: true,
            items: [
              {
                type: 'TextBlock',
                text: result.title,
                weight: 'Bolder'
              },
              {
                type: 'TextBlock',
                text: result.description || 'No description',
                wrap: true,
                maxLines: 2
              }
            ],
            selectAction: {
              type: 'Action.OpenUrl',
              url: `${process.env.FRONTEND_URL}/${result.type}s/${result.id}`
            }
          }
        );
      }
    });

    if (results.length > 5) {
      body.push({
        type: 'TextBlock',
        text: `... and ${results.length - 5} more results`,
        isSubtle: true
      });
    }

    return card;
  }

  /**
   * Handle Teams bot command
   */
  async handleBotCommand(command, text, userId) {
    try {
      const parts = text.trim().split(' ');
      const action = parts[0];

      switch (command) {
        case 'search':
          return await this.handleSearch(parts.slice(1).join(' '), userId);
        case 'brd':
          return await this.handleBRDCommand(action, parts.slice(1), userId);
        case 'story':
          return await this.handleStoryCommand(action, parts.slice(1), userId);
        default:
          return this.buildHelpCard();
      }
    } catch (error) {
      console.error('[TeamsService] Error handling command:', error);
      return this.buildErrorCard(error.message);
    }
  }

  /**
   * Handle search command
   */
  async handleSearch(query, userId) {
    if (!query) {
      return this.buildErrorCard('Please provide a search query');
    }

    // Search BRDs and Stories
    const brds = db.prepare(`
      SELECT id, title, description, 'brd' as type
      FROM brds
      WHERE title LIKE ? OR description LIKE ?
      LIMIT 3
    `).all(`%${query}%`, `%${query}%`);

    const stories = db.prepare(`
      SELECT id, title, description, 'story' as type
      FROM stories
      WHERE title LIKE ? OR description LIKE ?
      LIMIT 3
    `).all(`%${query}%`, `%${query}%`);

    const results = [...brds, ...stories];
    return this.buildSearchResultsCard(query, results);
  }

  /**
   * Handle BRD commands
   */
  async handleBRDCommand(action, args, userId) {
    switch (action) {
      case 'list':
        const brds = db.prepare(`
          SELECT id, title, status, created_at
          FROM brds
          ORDER BY created_at DESC
          LIMIT 5
        `).all();

        return this.buildListCard('Recent BRDs', brds, 'brd');

      default:
        return this.buildHelpCard();
    }
  }

  /**
   * Handle story commands
   */
  async handleStoryCommand(action, args, userId) {
    switch (action) {
      case 'list':
        const stories = db.prepare(`
          SELECT id, title, status, priority
          FROM stories
          ORDER BY created_at DESC
          LIMIT 5
        `).all();

        return this.buildListCard('Recent Stories', stories, 'story');

      default:
        return this.buildHelpCard();
    }
  }

  /**
   * Build list card
   */
  buildListCard(title, items, type) {
    const card = {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard',
            version: '1.4',
            body: [
              {
                type: 'TextBlock',
                text: title,
                weight: 'Bolder',
                size: 'Large'
              }
            ]
          }
        }
      ]
    };

    const body = card.attachments[0].content.body;

    items.forEach(item => {
      body.push({
        type: 'Container',
        separator: true,
        items: [
          {
            type: 'TextBlock',
            text: item.title,
            weight: 'Bolder'
          },
          {
            type: 'TextBlock',
            text: `Status: ${item.status}${item.priority ? ` | Priority: ${item.priority}` : ''}`,
            isSubtle: true
          }
        ],
        selectAction: {
          type: 'Action.OpenUrl',
          url: `${process.env.FRONTEND_URL}/${type}s/${item.id}`
        }
      });
    });

    return card;
  }

  /**
   * Build help card
   */
  buildHelpCard() {
    return {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard',
            version: '1.4',
            body: [
              {
                type: 'TextBlock',
                text: '📚 Available Commands',
                weight: 'Bolder',
                size: 'Large'
              },
              {
                type: 'TextBlock',
                text: '**search** [query] - Search BRDs and Stories\n**brd list** - List recent BRDs\n**story list** - List recent stories',
                wrap: true
              }
            ]
          }
        }
      ]
    };
  }

  /**
   * Build error card
   */
  buildErrorCard(message) {
    return {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard',
            version: '1.4',
            body: [
              {
                type: 'TextBlock',
                text: '❌ Error',
                weight: 'Bolder',
                size: 'Large',
                color: 'Attention'
              },
              {
                type: 'TextBlock',
                text: message,
                wrap: true
              }
            ]
          }
        }
      ]
    };
  }

  /**
   * Get user's Teams ID from database
   */
  getUserTeamsId(userId) {
    try {
      const result = db.prepare(
        'SELECT teams_user_id FROM users WHERE id = ?'
      ).get(userId);
      return result?.teams_user_id;
    } catch (error) {
      console.error('[TeamsService] Error getting Teams ID:', error);
      return null;
    }
  }
}

module.exports = new TeamsService();
