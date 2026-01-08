const { Configuration, OpenAIApi } = require('openai');

let cachedClient = null;

// Lazily initialize OpenAI client. Throws if API key is missing.
const getOpenAI = () => {
  if (cachedClient) return cachedClient;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const configuration = new Configuration({ apiKey });
  cachedClient = new OpenAIApi(configuration);
  return cachedClient;
};

module.exports = { getOpenAI };