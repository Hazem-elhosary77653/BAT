/**
 * AI Service
 * Handles all AI operations including OpenAI API calls
 * Manages prompts, caching, and response processing
 */

const OpenAI = require('openai');
const { sqlite: db } = require('../db/connection');

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

      this.openai = new OpenAI({
        apiKey: apiKey,
      });
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
      const openai = new OpenAI({
        apiKey: apiKey,
      });

      // Make a simple API call to verify the key works
      const response = await openai.models.list();

      return response && response.data && response.data.length > 0;
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

      const response = await this.openai.models.list();

      // Filter for GPT models
      const gptModels = response.data
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
        templateContent = null,
        language = 'en',
        detailLevel = 'standard',
        maxTokens = 4000,
        temperature = 0.7,
        targetAudience = null,
        inScope = null,
        outOfScope = null,
        tone = 'professional',
        selectedSections = null,
        externalLinks = null,
        stakeholders = []
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

      const prompt = this.buildBRDPrompt(storiesText, template, language, detailLevel, templateContent, {
        targetAudience,
        inScope,
        outOfScope,
        tone,
        selectedSections,
        externalLinks,
        stakeholders
      });

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert Business Requirements Document (BRD) writer with 15+ years of experience in enterprise software documentation. You specialize in creating well-structured, professional BRDs with clear table of contents, numbered sections, and organized functional requirements. Your documents are known for their clarity, completeness, and professional formatting.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: temperature,
        max_tokens: maxTokens,
      });

      if (response.choices && response.choices.length > 0) {
        return response.choices[0].message.content;
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
  buildBRDPrompt(storiesText, template, language, detailLevel, templateContent = null, context = {}) {
    const detailInstructions = {
      brief: 'Keep the BRD concise and focused on essentials.',
      standard: 'Provide a balanced BRD with all important details.',
      detailed: 'Create a comprehensive BRD with extensive details and examples.',
    };

    const structure = templateContent || `
# TABLE OF CONTENTS
1. Executive Summary
2. Project Overview
   2.1 Background
   2.2 Business Objectives
   2.3 Success Criteria
3. Scope
   3.1 In-Scope
   3.2 Out-of-Scope
4. Stakeholders
5. Functional Requirements
   5.1 Core Features
   5.2 User Stories Breakdown
   5.3 Detailed Feature Specifications
6. Non-Functional Requirements
   6.1 Performance
   6.2 Security
   6.3 Scalability
   6.4 Usability
7. User Interface & Experience
   7.1 UI Requirements
   7.2 User Workflows
8. Data Requirements
   8.1 Data Models
   8.2 Data Security & Privacy
9. Integration Requirements
10. Technical Considerations
    10.1 Architecture Overview
    10.2 Technology Stack
    10.3 Dependencies
11. Assumptions & Constraints
12. Risks & Mitigation
13. Timeline & Milestones
14. Acceptance Criteria
15. Appendix
    `;

    const toneInstructions = {
      professional: 'Use a professional, formal, and authoritative tone suitable for enterprise stakeholders.',
      technical: 'Focus on technical specifics, architecture details, and implementation logic for developers.',
      executive: 'Be concise, focus on high-level business value, ROI, and strategic alignment.',
      agile: 'Use a dynamic, user-centric, and iterative tone with a focus on fast delivery.'
    };

    const contextSection = `
PROJECT CONTEXT & BOUNDARIES:
- Primary Strategic Objective: ${context.targetAudience || 'Not specified'}
- In-Scope: ${context.inScope || 'All features derived from provided stories'}
- Out-of-Scope: ${context.outOfScope || 'To be determined during development'}
- Tone: ${context.tone || 'Professional'}
- Writing Style: ${toneInstructions[context.tone] || toneInstructions.professional}
- External Asset References: ${context.externalLinks || 'None provided'}

PROJECT GOVERNANCE & STAKEHOLDERS:
${(context.stakeholders || []).length > 0
        ? context.stakeholders.map(s => `- ${s.name} (${s.role})`).join('\n')
        : 'To be assigned'}
    `;

    // Map section names to structure items
    const sectionMap = {
      'Overview': '1. Executive Summary\n2. Project Overview\n   2.1 Background\n   2.2 Business Objectives',
      'Functional': '5. Functional Requirements\n   5.1 Core Features\n   5.2 User Stories Breakdown\n   5.3 Detailed Feature Specifications',
      'Security': '6.2 Security\n8.2 Data Security & Privacy',
      'Compliance': '8.2 Data Security & Privacy (Compliance Standards)',
      'Technical': '10. Technical Considerations\n    10.1 Architecture Overview\n    10.2 Technology Stack\n    10.3 Dependencies',
      'UX/UI': '7. User Interface & Experience\n   7.1 UI Requirements\n   7.2 User Workflows',
      'Analytics': '3.3 Success Metrics & KPIs\n15. Analytics & Reporting'
    };

    // Build structure based on selected sections if provided
    let finalStructure = '';
    if (context.selectedSections && context.selectedSections.length > 0) {
      finalStructure = '# TABLE OF CONTENTS\n\n' + context.selectedSections.map((s, i) => `${sectionMap[s] || s}`).join('\n\n');
    } else {
      finalStructure = structure;
    }

    return `
You are creating a professional Business Requirements Document (BRD) from the following user stories.

${storiesText}

${contextSection}

${templateContent ? 'Follow this CUSTOM TEMPLATE structure strictly. Fill in any {{variable_names}} using information from the stories and the project context provided above:' : `BRD Template Style: ${template}`}
Language: ${language}
Detail Level: ${detailLevel}

${detailInstructions[detailLevel] || detailInstructions.standard}

DOCUMENT STRUCTURE:
${finalStructure}

FORMATTING GUIDELINES:
1. Start with a professional cover page including project title and date
2. Include a well-formatted TABLE OF CONTENTS with page/section references
3. Use clear section headings with numbering (1, 1.1, 1.1.1)
4. Under each Functional Requirement, list specific features with:
   - Feature ID (e.g., FR-001, FR-002)
   - Feature Name
   - Description
   - Related User Stories
   - Acceptance Criteria
5. Use tables for structured data (stakeholders, requirements matrix, timeline)
6. Include bullet points and numbered lists for clarity
7. Add subsections under main sections for better organization
8. Ensure each section has descriptive content, not just headings

IMPORTANT: 
- Incorporate the Strategic Objective, Scope boundaries, and External links into relevant sections
- Make the document professional, well-structured, and easy to navigate
- Use Markdown formatting for headers, lists, tables, and emphasis
- Ensure consistency in numbering and formatting throughout
`;
  }

  /**
   * Generate a full BRD structured document directly from requirements text
   * @param {string} text - The source text
   * @param {Object} options - Generation options
   * @returns {Promise<string>} - Generated BRD content
   */
  async generateBRDFromText(text, options = {}) {
    try {
      if (!this.openai) throw new Error('OpenAI not initialized');

      const { language = 'en', detailLevel = 'standard' } = options;

      const prompt = `
Generate a comprehensive and professional Business Requirements Document (BRD) based on the following reference material.

REFERENCE CONTENT:
${text.substring(0, 10000)}

Language: ${language}
Detail Level: ${detailLevel}

The document must include:
1. Executive Summary
2. Business Objectives & Success Criteria
3. Detailed Scope (In-Scope and Out-of-Scope)
4. Target Stakeholders
5. Functional Requirements (Grouped by features)
6. Non-Functional Requirements (Security, Performance, etc.)
7. Assumptions, Constraints, and Risks

Use professional Markdown formatting with clear headers, tables, and bullet points. Ensure the structure is logical and suitable for enterprise-level projects.
`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert Senior Business Analyst. Your goal is to transform raw reference material into a high-quality, professional BRD.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      });

      if (response.choices && response.choices.length > 0) {
        return response.choices[0].message.content;
      }

      throw new Error('No response from AI');
    } catch (error) {
      console.error('BRD reconstruction error:', error.message);
      throw error;
    }
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

      const response = await this.openai.chat.completions.create({
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

      if (response.choices && response.choices.length > 0) {
        const responseText = response.choices[0].message.content;

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

      const response = await this.openai.chat.completions.create({
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

      if (response.choices && response.choices.length > 0) {
        const responseText = response.choices[0].message.content;
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

      const response = await this.openai.chat.completions.create({
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

      if (response.choices && response.choices.length > 0) {
        const responseText = response.choices[0].message.content.trim();
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
   * Analyze BRD for quality, gaps, and improvements
   * @param {string} content - BRD content
   * @returns {Promise<Object>} - Analysis results
   */
  async analyzeBRD(content) {
    try {
      if (!this.openai) throw new Error('OpenAI not initialized');

      const prompt = `
Analyze the following Business Requirements Document (BRD) content for:
1. Completeness (Are any key sections missing?)
2. Clarity (Is the language clear and unambiguous?)
3. Consistency (Are there any conflicting requirements?)
4. Professionalism (Does it meet industry standards?)

BRD Content:
${content.substring(0, 8000)}

Return a structured response in JSON format:
{
  "score": number (1-100),
  "summary": "string",
  "strengths": ["string", "string"],
  "gaps": ["string", "string"],
  "suggestions": ["string", "string"],
  "risk_level": "Low|Medium|High"
}
Return ONLY valid JSON.
`;

      console.log('[AIService] Analyzing BRD content...');

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a Senior Business Analyst Auditor. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 2000,
      });

      console.log('[AIService] Got response from OpenAI');

      if (response.choices && response.choices.length > 0) {
        const text = response.choices[0].message.content;
        console.log('[AIService] Response text:', text.substring(0, 200));
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        throw new Error('Failed to parse JSON from response');
      }
      throw new Error('No choices in response');
    } catch (error) {
      console.error('[AIService] BRD analysis error:', error.message);
      if (error.response) {
        console.error('[AIService] API Error Status:', error.response.status);
        console.error('[AIService] API Error Data:', JSON.stringify(error.response.data));
      }
      throw error;
    }
  }

  /**
   * Extract user stories from BRD content
   * @param {string} brdContent - The BRD text
   * @returns {Promise<Array>} - Extracted stories
   */
  async extractStoriesFromBRD(brdContent) {
    try {
      if (!this.openai) throw new Error('OpenAI not initialized');

      const prompt = `
Based on the following Business Requirements Document (BRD), extract a comprehensive list of User Stories.
For each story, provide:
1. Title
2. Description (As a... I want... so that...)
3. Acceptance Criteria (Array of strings)
4. Priority (P0, P1, P2)
5. Estimated Points (1, 2, 3, 5, 8)

BRD Content:
${brdContent.substring(0, 10000)}

Return ONLY a valid JSON array:
[
  {
    "title": "...",
    "description": "...",
    "acceptance_criteria": ["...", "..."],
    "priority": "...",
    "estimated_points": 0
  }
]
`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'system', content: 'You are an expert Agile Product Owner.' }, { role: 'user', content: prompt }],
        temperature: 0.3
      });

      if (response.choices && response.choices.length > 0) {
        const jsonMatch = response.choices[0].message.content.match(/\[[\s\S]*\]/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      }
      return [];
    } catch (error) {
      console.error('Extraction error:', error.message);
      throw error;
    }
  }

  /**
   * Extract user stories from a Mermaid diagram
   * @param {string} mermaidCode - The diagram source
   * @returns {Promise<Array>} - Extracted stories
   */
  async extractStoriesFromDiagram(mermaidCode) {
    try {
      if (!this.openai) throw new Error('OpenAI not initialized');

      const prompt = `
Based on the following Mermaid diagram code, extract a list of User Stories that can be derived from the logic, flow, or structure shown.
Consider actors, actions, relationships, and data flows.

For each story, provide:
1. Title
2. Description (As a... I want... so that...)
3. Acceptance Criteria (Array of strings)
4. Priority (P0, P1, P2)
5. Estimated Points (1, 2, 3, 5, 8)

Mermaid Code:
${mermaidCode}

Return ONLY a valid JSON array:
[
{
  "title": \"...\",
  "description": \"...\",
  "acceptance_criteria": [\"...\", \"...\"],
  "priority": \"...\",
  "estimated_points": 0
}
]
`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o', // Using a better model for diagram logic analysis
        messages: [
          { role: 'system', content: 'You are an expert Agile Product Owner and Systems Analyst.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      });

      if (response.choices && response.choices.length > 0) {
        const jsonMatch = response.choices[0].message.content.match(/\[[\s\S]*\]/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      }
      return [];
    } catch (error) {
      console.error('Diagram story extraction error:', error.message);
      throw error;
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
   * Smart Edit: Refine text based on instruction
   * @param {string} text - The original text selected by user
   * @param {string} instruction - The user's instruction (e.g., "Make detailed")
   * @param {string} context - Optional context (surrounding text or document summary)
   * @returns {Promise<string>} - The rewritten text
   */
  async smartEditText(text, instruction, context = '') {
    try {
      if (!this.openai) throw new Error('OpenAI not initialized');

      const prompt = `
You are an expert technical writer and editor refining a Business Requirements Document (BRD).
Your task is to REWRITE the following text based on the specific instruction provided.

INSTRUCTION: ${instruction}

ORIGINAL TEXT:
${text}

${context ? `CONTEXT (Surrounding text or info): ${context}` : ''}

RULES:
1. Return ONLY the rewritten text. Do not add conversational filler ("Here is the rewritten text...").
2. Maintain the original Markdown formatting (headers, lists, bolding) unless the instruction implies changing it.
3. Be professional and clear.
`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a precise text editor. Output only the transformed text.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      if (response.choices && response.choices.length > 0) {
        return response.choices[0].message.content.trim();
      }
      throw new Error('No response from AI');
    } catch (error) {
      console.error('Smart Edit error:', error.message);
      throw error;
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
  /**
   * Generate a Mermaid diagram using AI
   * @param {string} context - The context (BRD content or prompt)
   * @param {string} type - Diagram type (flowchart, sequence, class, state, entityRelationship)
   * @returns {Promise<Object>} - Diagram object with title, description, and mermaid_code
   */
  async generateDiagram(context, type = 'flowchart') {
    try {
      if (!this.openai) throw new Error('OpenAI not initialized');

      let prompt = '';
      let systemContent = 'You are an expert system architect and Mermaid.js specialist. Return only valid JSON.';

      if (type === 'bpmn') {
        prompt = `
Generate a professional BPMN 2.0 XML diagram based on the following context.

Context:
${context.substring(0, 8000)}

Rules for generation:
1. Return ONLY the valid BPMN 2.0 XML content.
2. Ensure all standard BPMN 2.0 namespaces are included.
3. Use descriptive labels for tasks, events, and gateways.
4. Ensure the XML has a DI (Diagram Interchange) section so it can be rendered visually.
5. Also provide a concise title and a 1-sentence description for the diagram.

Expected JSON format:
{
  "title": "string",
  "description": "string",
  "mermaid_code": "string"
}
Note: Place the BPMN XML in the "mermaid_code" field.
Return ONLY valid JSON.
`;
        systemContent = 'You are an expert Business Process Model and Notation (BPMN) specialist. Return only valid JSON.';
      } else {
        prompt = `
Generate a professional Mermaid.js diagram based on the following context.
Diagram Type: ${type}

Context:
${context.substring(0, 8000)}

Rules for generation:
1. Return ONLY the Mermaid.js code block starting with the diagram type (e.g., "graph TD", "sequenceDiagram", etc.).
2. Do not include markdown code fences (\`\`\`).
3. Use descriptive labels for nodes and actors.
4. Ensure the syntax is valid for Mermaid.js.
5. Also provide a concise title and a 1-sentence description for the diagram.

Expected JSON format:
{
  "title": "string",
  "description": "string",
  "mermaid_code": "string"
}
Return ONLY valid JSON.
`;
      }

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o', // Use a stronger model for complex syntax if possible
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      if (response.choices && response.choices.length > 0) {
        return JSON.parse(response.choices[0].message.content);
      }
      throw new Error('No response from AI');
    } catch (error) {
      console.error('Diagram generation error:', error.message);
      throw error;
    }
  }

  /**
   * Estimate project effort, complexity, and resources from BRD content
   * @param {string} content - BRD content
   * @returns {Promise<Object>} - Estimation results
   */
  async estimateProjectEffort(content) {
    try {
      if (!this.openai) throw new Error('OpenAI not initialized');

      const prompt = `
Analyze the following Business Requirements Document (BRD) content and provide a strategic estimation for the project.
Provide:
1. Estimated Man-Hours (Total effort for implementation).
2. Complexity Score (1-10, where 1 is simple and 10 is extremely complex).
3. Recommended Team Composition (Roles and count).
4. Estimated Duration (e.g., "4 months").
5. Key Challenges (List of main technical or business risks).

BRD Content:
${content.substring(0, 8000)}

Return a structured response in JSON format:
{
  "man_hours": number,
  "complexity_score": number,
  "recommended_team": ["string", "string"],
  "estimated_duration": "string",
  "key_challenges": ["string", "string"],
  "rationale": "Briefly explain the estimation basis"
}
Return ONLY valid JSON.
`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a Senior Project Manager and Solution Architect. Your estimates are data-driven and realistic. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      });

      if (response.choices && response.choices.length > 0) {
        const text = response.choices[0].message.content;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
      throw new Error('Failed to parse estimation from AI response');
    } catch (error) {
      console.error('[AIService] Effort estimation error:', error.message);
      throw error;
    }
  }

  /**
   * Generate wireframe from text/context
   */
  async generateWireframe(context, options = {}) {
    try {
      if (!this.openai) throw new Error('OpenAI not initialized');

      const { type = 'ui_mockup', complexity = 'standard' } = options;

      const prompt = `
Generate a professional UI wireframe as JSON based on the following context.
Wireframe Type: ${type}
Complexity Level: ${complexity}

Context:
${context.substring(0, 8000)}

Rules for generation:
1. Create a realistic wireframe layout in JSON format.
2. Include sections like header, navigation, main content, sidebar, footer as needed.
3. For each section, describe the UI elements (buttons, forms, images, text, etc.).
4. Provide positioning hints (top, left, width, height as percentages).
5. Include color scheme suggestions.
6. Add brief descriptions for each element's purpose.

Expected JSON format (Excalidraw-compatible):
{
  "title": "string",
  "description": "string",
  "wireframe_type": "${type}",
  "complexity": "${complexity}",
  "layout": {
    "sections": [
      {
        "name": "section_name",
        "position": {"top": "0%", "left": "0%", "width": "100%", "height": "20%"},
        "backgroundColor": "color_hex",
        "elements": [
          {
            "type": "button|input|text|image|card|etc",
            "label": "string",
            "position": {"top": "10%", "left": "5%", "width": "20%", "height": "50%"},
            "description": "string"
          }
        ]
      }
    ]
  },
  "color_scheme": {
    "primary": "color_hex",
    "secondary": "color_hex",
    "background": "color_hex",
    "text": "color_hex"
  },
  "notes": "string with additional design notes"
}

Return ONLY valid JSON.
`;

      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert UI/UX designer. Return only valid JSON wireframe specifications.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const content = response.choices[0].message.content.trim();
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Failed to parse wireframe from AI response');
    } catch (error) {
      console.error('[AIService] Wireframe generation error:', error.message);
      throw error;
    }
  }
}

module.exports = new AIService();
