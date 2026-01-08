// Verify OpenAI API Key Script
require('dotenv').config();
const { Configuration, OpenAIApi } = require('openai');

console.log('═══════════════════════════════════════════════════════════');
console.log('           OpenAI API Key Verification Tool');
console.log('═══════════════════════════════════════════════════════════\n');

// Step 1: Check if API key exists in .env
console.log('Step 1: Checking .env file...');
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ ERROR: OPENAI_API_KEY not found in .env file');
  console.log('\n📝 To fix: Add this line to backend/.env:');
  console.log('   OPENAI_API_KEY=your_actual_api_key_here\n');
  process.exit(1);
}
console.log('✅ API key found in .env file\n');

// Step 2: Validate API key format
console.log('Step 2: Validating key format...');
const apiKey = process.env.OPENAI_API_KEY;
const keyStart = apiKey.substring(0, 8);
const keyEnd = apiKey.substring(apiKey.length - 4);

console.log(`   Key starts with: ${keyStart}`);
console.log(`   Key ends with: ...${keyEnd}`);
console.log(`   Key length: ${apiKey.length} characters`);

if (!apiKey.startsWith('sk-')) {
  console.error('❌ WARNING: Key should start with "sk-"');
}

if (apiKey.includes('your_openai_api_key')) {
  console.error('❌ ERROR: You are using a placeholder key');
  console.log('\n📝 Get a real key from: https://platform.openai.com/api-keys\n');
  process.exit(1);
}

if (apiKey.length < 40) {
  console.error('❌ WARNING: Key seems too short (might be invalid)');
}

console.log('✅ Key format looks valid\n');

// Step 3: Test API connection
console.log('Step 3: Testing OpenAI API connection...');
console.log('   Making test request to OpenAI...');

const configuration = new Configuration({
  apiKey: apiKey,
});
const openai = new OpenAIApi(configuration);

async function testConnection() {
  try {
    const startTime = Date.now();
    
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant.',
        },
        {
          role: 'user',
          content: 'Respond with exactly 5 words.',
        },
      ],
      max_tokens: 20,
      temperature: 0.7,
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const response = completion.data.choices[0].message.content;
    
    console.log(`✅ Connection successful! (${responseTime}ms)\n`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('                    TEST RESPONSE');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   "${response}"\n`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('                   ✅ ALL CHECKS PASSED');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('✨ Your OpenAI API key is working correctly!');
    console.log('🚀 You can now use the AI chatbot in your application.\n');
    
    // Additional info
    console.log('📊 API Information:');
    console.log(`   Model used: ${completion.data.model}`);
    console.log(`   Tokens used: ${completion.data.usage.total_tokens} (${completion.data.usage.prompt_tokens} prompt + ${completion.data.usage.completion_tokens} completion)`);
    console.log(`   Response time: ${responseTime}ms\n`);
    
  } catch (error) {
    console.error('❌ Connection FAILED\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('                    ERROR DETAILS');
    console.log('═══════════════════════════════════════════════════════════');
    
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data?.error;
      
      console.log(`   HTTP Status: ${status}`);
      console.log(`   Error Type: ${errorData?.type || 'Unknown'}`);
      console.log(`   Error Code: ${errorData?.code || 'Unknown'}`);
      console.log(`   Message: ${errorData?.message || error.message}\n`);
      
      console.log('═══════════════════════════════════════════════════════════');
      console.log('                 TROUBLESHOOTING GUIDE');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      if (status === 401) {
        console.log('❌ INVALID API KEY (401 Unauthorized)\n');
        console.log('   Possible causes:');
        console.log('   1. The API key is incorrect or has typos');
        console.log('   2. The API key has been revoked or expired');
        console.log('   3. The API key is not activated yet\n');
        console.log('   Solutions:');
        console.log('   → Go to: https://platform.openai.com/api-keys');
        console.log('   → Create a new API key');
        console.log('   → Copy it immediately (you can only see it once)');
        console.log('   → Update backend/.env file with the new key');
        console.log('   → Run this script again to verify\n');
      } else if (status === 429) {
        console.log('❌ RATE LIMIT / QUOTA EXCEEDED (429)\n');
        console.log('   Possible causes:');
        console.log('   1. No credits in your OpenAI account');
        console.log('   2. Rate limit exceeded (too many requests)');
        console.log('   3. Usage tier limits reached\n');
        console.log('   Solutions:');
        console.log('   → Check billing: https://platform.openai.com/account/billing');
        console.log('   → Add credits to your account ($5 minimum)');
        console.log('   → Wait a few minutes if rate limited');
        console.log('   → Check usage: https://platform.openai.com/usage\n');
      } else if (status === 403) {
        console.log('❌ ACCESS FORBIDDEN (403)\n');
        console.log('   Your API key does not have access to this resource.\n');
        console.log('   Solutions:');
        console.log('   → Verify your OpenAI account is in good standing');
        console.log('   → Check if you have access to GPT-3.5-turbo model');
        console.log('   → Contact OpenAI support if needed\n');
      } else {
        console.log(`❌ HTTP ERROR ${status}\n`);
        console.log('   Solutions:');
        console.log('   → Check OpenAI status: https://status.openai.com');
        console.log('   → Try again in a few minutes');
        console.log('   → Contact OpenAI support if persists\n');
      }
    } else {
      console.log(`   Error: ${error.message}\n`);
      console.log('   This might be a network or configuration issue.');
      console.log('   → Check your internet connection');
      console.log('   → Verify firewall settings');
      console.log('   → Check if OpenAI services are available\n');
    }
    
    process.exit(1);
  }
}

testConnection();
