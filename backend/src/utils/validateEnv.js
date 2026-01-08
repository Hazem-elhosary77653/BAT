const REQUIRED_VARS = ['JWT_SECRET', 'OPENAI_API_KEY'];

const validateEnv = () => {
  const missing = [];

  REQUIRED_VARS.forEach((key) => {
    if (!process.env[key] || `${process.env[key]}`.trim() === '') {
      missing.push(key);
    }
  });

  // DB checks
  const dbType = process.env.DB_TYPE || 'sqlite';
  if (dbType === 'postgresql' || dbType === 'postgres') {
    ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'].forEach((key) => {
      if (!process.env[key] || `${process.env[key]}`.trim() === '') {
        missing.push(key);
      }
    });
  }

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Optional but recommended warnings
  if (!process.env.CORS_ORIGIN) {
    console.warn('⚠️  CORS_ORIGIN not set, defaulting to http://localhost:3000');
  }
  if (!process.env.AZURE_DEVOPS_PAT) {
    console.warn('⚠️  AZURE_DEVOPS_PAT not set; Azure DevOps sync will be disabled until provided.');
  }
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('⚠️  Email credentials not set; emails will be logged instead of sent.');
  }
};

module.exports = { validateEnv };