# OpenAI API Key Setup Instructions

## ⚠️ Important Notice

The provided API key appears to be invalid or expired. You'll need to generate a new OpenAI API key to use the chatbot feature.

## How to Get a Valid OpenAI API Key

### Step 1: Create an OpenAI Account
1. Go to [https://platform.openai.com](https://platform.openai.com)
2. Click "Sign Up" (or "Log In" if you have an account)
3. Complete the registration process

### Step 2: Generate an API Key
1. Once logged in, click on your profile icon (top right)
2. Select "View API Keys" or go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
3. Click "Create new secret key"
4. Give it a name (e.g., "Business Analyst Tool")
5. **Copy the key immediately** - you won't be able to see it again!

### Step 3: Add Credits to Your Account
1. OpenAI requires prepaid credits to use their API
2. Go to [https://platform.openai.com/account/billing](https://platform.openai.com/account/billing)
3. Add a payment method
4. Purchase credits (minimum $5)

### Step 4: Configure the Application

1. Open the file: `backend/.env`
2. Find the line: `OPENAI_API_KEY=...`
3. Replace with your new key:
   ```env
   OPENAI_API_KEY=[REDACTED]
   ```
4. Save the file

### Step 5: Test the Configuration

Run the test script:
```bash
cd backend
node test-openai.js
```

You should see:
```
✅ OpenAI API Key found
✅ OpenAI API connection successful!
✅ All systems ready!
```

## Cost Estimates

The chatbot uses GPT-3.5-turbo, which is very affordable:

- **Input**: $0.0015 per 1K tokens
- **Output**: $0.002 per 1K tokens
- **Average conversation**: ~$0.001 - $0.003

**Example costs:**
- 100 messages: ~$0.20
- 1,000 messages: ~$2.00
- 10,000 messages: ~$20.00

## Alternative: Use a Different Model

If you have access to other models, you can configure them:

### Option 1: GPT-4 (More Accurate, More Expensive)
Edit `backend/src/controllers/chatController.js`:
```javascript
model: 'gpt-4',  // Change from 'gpt-3.5-turbo'
```

**Cost**: ~15x more than GPT-3.5-turbo

### Option 2: Use Azure OpenAI
If you have Azure OpenAI access, you can modify the configuration to use Azure endpoints instead.

## Using the App Without OpenAI

If you don't want to use OpenAI right now, the rest of the application still works perfectly:

✅ Dashboard with stats and charts
✅ User Stories management
✅ BRD creation and management
✅ Document management
✅ Templates
✅ Reports
✅ Diagrams

❌ AI Chatbot (requires OpenAI key)
❌ AI-powered user story generation
❌ AI-powered BRD generation

The chatbot button will still appear, but you'll see an error message when trying to use it.

## Security Best Practices

### ⚠️ NEVER Share Your API Key
- Don't commit it to Git repositories
- Don't share it in screenshots
- Don't post it in forums or chat

### ✅ Keep It Secure
- Store only in `.env` file
- Add `.env` to `.gitignore`
- Rotate keys periodically
- Set usage limits in OpenAI dashboard

### 🔒 Monitor Usage
1. Check your usage at [https://platform.openai.com/usage](https://platform.openai.com/usage)
2. Set up billing alerts
3. Review API logs regularly

## Troubleshooting

### Error: "Incorrect API key provided"
- ✅ Double-check the key in `.env`
- ✅ Make sure there are no extra spaces
- ✅ Verify the key is active in OpenAI dashboard
- ✅ Check if the key has been revoked

### Error: "Rate limit exceeded"
- ✅ You've hit OpenAI's rate limits
- ✅ Wait a few minutes and try again
- ✅ Consider upgrading your OpenAI plan

### Error: "Insufficient quota"
- ✅ Add more credits to your OpenAI account
- ✅ Check your billing at platform.openai.com

### Error: "Model not found"
- ✅ Verify you have access to GPT-3.5-turbo
- ✅ Check if your account is approved for API access

## Support

### OpenAI Resources
- **Documentation**: [https://platform.openai.com/docs](https://platform.openai.com/docs)
- **API Reference**: [https://platform.openai.com/docs/api-reference](https://platform.openai.com/docs/api-reference)
- **Support**: [https://help.openai.com](https://help.openai.com)

### Application Support
- Check `CHATBOT_QUICKSTART.md` for usage instructions
- Review `AI_CHATBOT_IMPLEMENTATION.md` for technical details
- Run `node test-openai.js` to test configuration

## Quick Setup Summary

1. Get API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Add credits to your account
3. Update `backend/.env` with your key
4. Test with `node test-openai.js`
5. Restart the backend server
6. Start chatting! 🎉

---

**Need help?** Check the OpenAI documentation or the app's troubleshooting guides.
