const OpenAI = require('openai');

let cachedClient = null;

// Lazily initialize OpenAI client. Throws if API key is missing.
const getOpenAI = () => {
  if (cachedClient) return cachedClient;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  cachedClient = new OpenAI({ apiKey });
  return cachedClient;
};

module.exports = { getOpenAI };