const { getOpenAI } = require('../utils/openaiClient');

// Chat with AI
const chat = async (req, res) => {
  try {
    // Validate OpenAI is initialized
    const ai = getOpenAI();

    const { message, history } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Build messages array for context
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant for a Business Analyst tool. You help users with business analysis tasks, creating user stories, BRDs, diagrams, and documentation. Provide clear, concise, and professional responses.',
      },
    ];

    // Add conversation history
    if (history && Array.isArray(history)) {
      history.forEach((msg) => {
        if (msg.role && msg.content) {
          messages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      });
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message,
    });

    // Call OpenAI API
    const completion = await ai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const aiResponse = completion.data.choices[0].message.content;

    res.json({
      message: aiResponse,
      success: true,
    });
  } catch (error) {
    console.error('OpenAI API Error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to get AI response',
      details: error.response?.data?.error?.message || error.message,
    });
  }
};

// Generate user story with AI
const generateUserStory = async (req, res) => {
  try {
    const ai = getOpenAI();
    
    const { description, feature } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const prompt = `Generate a professional user story based on the following:
Feature: ${feature || 'Not specified'}
Description: ${description}

Please format the user story with:
- Title
- As a [user type]
- I want [goal]
- So that [benefit]
- Acceptance Criteria (numbered list)`;

    const completion = await ai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert business analyst. Generate well-structured user stories.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 700,
      temperature: 0.7,
    });

    const story = completion.data.choices[0].message.content;

    res.json({
      story,
      success: true,
    });
  } catch (error) {
    console.error('OpenAI API Error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to generate user story',
      details: error.response?.data?.error?.message || error.message,
    });
  }
};

// Generate BRD with AI
const generateBRD = async (req, res) => {
  try {
    const ai = getOpenAI();

    const { projectName, objectives, scope } = req.body;

    if (!projectName || !objectives) {
      return res.status(400).json({ error: 'Project name and objectives are required' });
    }

    const prompt = `Generate a Business Requirements Document (BRD) outline for:
Project Name: ${projectName}
Objectives: ${objectives}
Scope: ${scope || 'Not specified'}

Please include:
1. Executive Summary
2. Business Objectives
3. Scope
4. Stakeholders
5. Functional Requirements
6. Non-Functional Requirements
7. Assumptions and Constraints`;

    const completion = await ai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert business analyst creating professional Business Requirements Documents.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const brd = completion.data.choices[0].message.content;

    res.json({
      brd,
      success: true,
    });
  } catch (error) {
    console.error('OpenAI API Error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to generate BRD',
      details: error.response?.data?.error?.message || error.message,
    });
  }
};

module.exports = {
  chat,
  generateUserStory,
  generateBRD,
};
