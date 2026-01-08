/**
 * AI Service
 * Handles all AI operations including OpenAI API calls
 * Manages prompts, caching, and response processing
 */

const { Configuration, OpenAIApi } = require('openai');
const db = require('better-sqlite3')('database.db');

class AIService {
  constructor() {
    this.openai = null;
    this.initialized = false;
  }

  /**
   * Initialize OpenAI with API key
   * @param {string} apiKey - OpenAI API key
   * @returns {boolean} - Success status
   */
  initializeOpenAI(apiKey) {
    try {
      if (!apiKey) {
        throw new Error('API key is required');
      }

      const configuration = new Configuration({
        apiKey: apiKey,
      });

      this.openai = new OpenAIApi(configuration);
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('OpenAI initialization error:', error.message);
      return false;
    }
  }

  /**
   * Verify OpenAI API key is valid
   * @param {string} apiKey - API key to test
   * @returns {Promise<boolean>}
   */
  async testOpenAIConnection(apiKey) {
    try {
      const configuration = new Configuration({
        apiKey: apiKey,
      });

      const openai = new OpenAIApi(configuration);

      // Make a simple API call to verify the key works
      const response = await openai.listModels();

      return response.status === 200 && response.data.data.length > 0;
    } catch (error) {
      console.error('OpenAI connection test failed:', error.message);
      return false;
    }
  }

  /**
   * Get available OpenAI models
   * @returns {Promise<Array>}
   */
  async getAvailableModels() {
    try {
      if (!this.openai) {
        throw new Error('OpenAI not initialized. Please configure API key first.');
      }

      const response = await this.openai.listModels();
      
      // Filter for GPT models
      const gptModels = response.data.data
        .filter(model => model.id.includes('gpt'))
        .map(model => ({
          id: model.id,
          name: model.id,
          owner: model.owned_by,
        }))
        .sort((a, b) => b.id.localeCompare(a.id));

      return gptModels;
    } catch (error) {
      console.error('Error fetching models:', error.message);
      return [];
    }
  }

  /**
   * Generate BRD from user stories using AI
   * @param {Array} stories - Array of user story objects
   * @param {Object} options - Generation options
   * @returns {Promise<string>} - Generated BRD content
   */
  async generateBRDFromStories(stories, options = {}) {
    try {
      if (!this.openai) {
        throw new Error('OpenAI not initialized');
      }

      const {
        template = 'full',
        language = 'en',
        detailLevel = 'standard',
        maxTokens = 3000,
        temperature = 0.7,
      } = options;

      // Format stories for the prompt
      const storiesText = stories
        .map((story, index) => `
Story ${index + 1}: ${story.title}
Description: ${story.description}
Acceptance Criteria:
${(story.acceptance_criteria || []).map((ac) => `- ${ac}`).join('\n')}
Priority: ${story.priority}
`)
        .join('\n---\n');

      const prompt = this.buildBRDPrompt(storiesText, template, language, detailLevel);

      const response = await this.openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert Business Requirements Document writer. Generate professional, well-structured BRDs.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: temperature,
        max_tokens: maxTokens,
      });

      if (response.data.choices && response.data.choices.length > 0) {
        return response.data.choices[0].message.content;
      }

      throw new Error('No response from OpenAI');
    } catch (error) {
      console.error('BRD generation error:', error.message);
      throw error;
    }
  }

  /**
   * Build BRD generation prompt
   * @private
   */
  buildBRDPrompt(storiesText, template, language, detailLevel) {
    const detailInstructions = {
      brief: 'Keep the BRD concise and focused on essentials.',
      standard: 'Provide a balanced BRD with all important details.',
      detailed: 'Create a comprehensive BRD with extensive details and examples.',
    };

    return `
You are creating a Business Requirements Document (BRD) from the following user stories:

${storiesText}

BRD Template: ${template}
Language: ${language}
Detail Level: ${detailLevel}

${detailInstructions[detailLevel] || detailInstructions.standard}

Please structure the BRD as follows:
1. Executive Summary (brief overview of the business need)
2. Business Objectives (derived from the stories)
3. Functional Requirements (detailed breakdown)
4. Non-Functional Requirements (performance, security, scalability)
5. Acceptance Criteria (from the stories)
6. Assumptions and Dependencies
7. Technical Considerations
8. Success Metrics

Format the output in Markdown format.
`;
  }

  /**
   * Generate user stories from requirements text
   * @param {string} requirementsText - Requirements description
   * @param {Object} options - Generation options
   * @returns {Promise<Array>} - Array of generated stories
   */
  async generateStoriesFromRequirements(requirementsText, options = {}) {
    try {
      if (!this.openai) {
        throw new Error('OpenAI not initialized');
      }

      const {
        storyCount = 5,
        complexity = 'standard',
        language = 'en',
        maxTokens = 3000,
        temperature = 0.7,
      } = options;

      const prompt = this.buildStoryGenerationPrompt(
        requirementsText,
        storyCount,
        complexity,
        language
      );

      const response = await this.openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert Agile product manager and business analyst. Generate well-formed user stories in JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: temperature,
        max_tokens: maxTokens,
      });

      if (response.data.choices && response.data.choices.length > 0) {
        const responseText = response.data.choices[0].message.content;
        
        // Extract JSON from response
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const stories = JSON.parse(jsonMatch[0]);
          return stories;
        }

        throw new Error('Could not parse generated stories');
      }

      throw new Error('No response from OpenAI');
    } catch (error) {
      console.error('Story generation error:', error.message);
      throw error;
    }
  }

  /**
   * Build story generation prompt
   * @private
   */
  buildStoryGenerationPrompt(requirementsText, storyCount, complexity, language) {
    const complexityGuide = {
      simple: 'Keep stories simple and atomic, each addressing one clear feature.',
      standard: 'Create stories with typical scope - one feature with multiple acceptance criteria.',
      complex: 'Create comprehensive stories with detailed acceptance criteria and technical considerations.',
    };

    return `
Requirements Text:
${requirementsText}

Generate exactly ${storyCount} user stories from the requirements above.

Complexity Level: ${complexity}
${complexityGuide[complexity] || complexityGuide.standard}

For each story, provide:
1. A clear title (5-10 words)
2. Description following format: "As a [user type] I want [action] so that [benefit]"
3. List of 3-5 acceptance criteria (SMART criteria)
4. Estimated story points (Fibonacci scale: 1, 2, 3, 5, 8, 13, 21)
5. Priority level (P0=Critical, P1=High, P2=Medium, P3=Low)
6. Brief business value explanation

Return ONLY valid JSON array with this structure:
[
  {
    "title": "string",
    "description": "string",
    "acceptance_criteria": ["criterion1", "criterion2", ...],
    "estimated_points": number,
    "priority": "P0|P1|P2|P3",
    "business_value": "string"
  }
]
`;
  }

  /**
   * Refine a user story using AI
   * @param {Object} story - Story to refine
   * @param {string} feedback - Refinement feedback
   * @returns {Promise<Object>} - Refined story
   */
  async refineStory(story, feedback) {
    try {
      if (!this.openai) {
        throw new Error('OpenAI not initialized');
      }

      const prompt = `
Original Story:
Title: ${story.title}
Description: ${story.description}
Acceptance Criteria: ${(story.acceptance_criteria || []).join(', ')}

Refinement Feedback: ${feedback}

Based on the feedback, improve the user story. Maintain the same JSON structure:
{
  "title": "string",
  "description": "string",
  "acceptance_criteria": ["criterion1", "criterion2", ...],
  "estimated_points": number,
  "priority": "P0|P1|P2|P3",
  "business_value": "string"
}

Return ONLY valid JSON.
`;

      const response = await this.openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert Agile product manager. Refine user stories based on feedback.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      if (response.data.choices && response.data.choices.length > 0) {
        const responseText = response.data.choices[0].message.content;
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }

      throw new Error('Failed to refine story');
    } catch (error) {
      console.error('Story refinement error:', error.message);
      throw error;
    }
  }

  /**
   * Estimate story points using AI
   * @param {Object} story - Story to estimate
   * @returns {Promise<number>} - Estimated points
   */
  async estimateStoryPoints(story) {
    try {
      if (!this.openai) {
        throw new Error('OpenAI not initialized');
      }

      const prompt = `
User Story: ${story.title}
Description: ${story.description}
Acceptance Criteria: ${(story.acceptance_criteria || []).join(', ')}

Based on the complexity and scope, estimate the story points using Fibonacci scale (1, 2, 3, 5, 8, 13, 21).
Consider:
- Complexity of implementation
- Number of acceptance criteria
- Dependencies
- Unknowns

Return ONLY a number (1, 2, 3, 5, 8, 13, or 21).
`;

      const response = await this.openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an Agile estimation expert. Provide accurate story point estimates.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 10,
      });

      if (response.data.choices && response.data.choices.length > 0) {
        const responseText = response.data.choices[0].message.content.trim();
        const points = parseInt(responseText);
        
        const validPoints = [1, 2, 3, 5, 8, 13, 21];
        if (validPoints.includes(points)) {
          return points;
        }
      }

      return 5; // Default to 5 if estimation fails
    } catch (error) {
      console.error('Story estimation error:', error.message);
      return 5; // Return default on error
    }
  }

  /**
   * Get configuration from database
   * @param {number} userId - User ID
   * @returns {Object|null}
   */
  getConfiguration(userId) {
    try {
      const stmt = db.prepare('SELECT * FROM ai_configurations WHERE user_id = ?');
      return stmt.get(userId);
    } catch (error) {
      console.error('Error fetching configuration:', error.message);
      return null;
    }
  }

  /**
   * Save configuration to database
   * @param {number} userId - User ID
   * @param {Object} config - Configuration object
   * @returns {boolean}
   */
  saveConfiguration(userId, config) {
    try {
      const existing = this.getConfiguration(userId);

      if (existing) {
        // Update existing
        const stmt = db.prepare(`
          UPDATE ai_configurations 
          SET model = ?, temperature = ?, max_tokens = ?, language = ?, 
              detail_level = ?, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `);

        stmt.run(
          config.model,
          config.temperature,
          config.max_tokens,
          config.language,
          config.detail_level,
          userId
        );
      } else {
        // Insert new
        const stmt = db.prepare(`
          INSERT INTO ai_configurations 
          (user_id, model, temperature, max_tokens, language, detail_level, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `);

        stmt.run(
          userId,
          config.model,
          config.temperature,
          config.max_tokens,
          config.language,
          config.detail_level
        );
      }

      return true;
    } catch (error) {
      console.error('Error saving configuration:', error.message);
      return false;
    }
  }
}

module.exports = new AIService();
