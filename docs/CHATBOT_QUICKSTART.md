# Quick Start Guide - Dashboard & AI Chatbot

## What's New? 🎉

### 1. **Enhanced Dashboard**
   - Modern, gradient-styled cards with trend indicators
   - Interactive charts (Bar & Pie charts)
   - Improved activity timeline
   - Better visual hierarchy and animations

### 2. **AI Chatbot Assistant** 🤖
   - Powered by OpenAI GPT-3.5-turbo
   - Available on all dashboard pages
   - Context-aware conversations
   - Specialized in Business Analysis tasks

## How to Start

### Step 1: Start the Backend
```bash
cd backend
npm start
```
✅ Backend should run on `http://localhost:3001`

### Step 2: Start the Frontend (in a new terminal)
```bash
cd frontend
npm run dev
```
✅ Frontend should run on `http://localhost:3000`

### Step 3: Login and Access Dashboard
1. Open browser: `http://localhost:3000`
2. Login with your credentials
3. Navigate to Dashboard

## Using the AI Chatbot

### Opening the Chatbot
- Look for the **blue chat icon (💬)** in the bottom-right corner
- Click it to open the chat window

### Example Conversations

**Creating User Stories:**
```
You: "Help me create a user story for a login feature"
AI: [Provides formatted user story with acceptance criteria]
```

**Getting BRD Help:**
```
You: "What sections should I include in a BRD?"
AI: [Lists and explains BRD sections]
```

**General BA Questions:**
```
You: "Explain the difference between functional and non-functional requirements"
AI: [Provides detailed explanation]
```

### Quick Tips
- Press **Enter** to send messages (or click Send button)
- Chat maintains conversation context
- Close window by clicking the X
- Reopen anytime - your conversation continues

## Dashboard Features

### 📊 Stats Cards
- **User Stories** - Total count with trend
- **BRDs** - Total count with trend
- **Documents** - Total count with trend
- **Reports** - Total count with trend

### 📈 Charts
- **Bar Chart** - User Stories by Status
- **Pie Chart** - BRD Distribution by Status

### 📝 Recent Activities
- Timeline of recent actions
- Entity types and dates
- Quick overview of your work

## API Endpoints (For Developers)

### Chat Endpoint
```javascript
POST /api/ai/chat
Headers: { Authorization: "Bearer <token>" }
Body: {
  "message": "Your question",
  "history": [] // optional
}
```

### Generate User Story
```javascript
POST /api/ai/generate-user-story
Headers: { Authorization: "Bearer <token>" }
Body: {
  "description": "Feature description",
  "feature": "Feature name"
}
```

### Generate BRD
```javascript
POST /api/ai/generate-brd
Headers: { Authorization: "Bearer <token>" }
Body: {
  "projectName": "Project name",
  "objectives": "Objectives",
  "scope": "Scope"
}
```

## Configuration

### OpenAI API Key
The API key is configured in `backend/.env`:
```env
OPENAI_API_KEY=[REDACTED]...
```

### Environment Variables
All configuration is in `backend/.env`:
- Database settings
- Server port
- JWT secret
- OpenAI API key
- Azure DevOps settings

## Troubleshooting

### Chatbot Not Working?
1. ✅ Check backend is running
2. ✅ Verify you're logged in
3. ✅ Check browser console for errors
4. ✅ Ensure OpenAI API key is valid

### Dashboard Not Loading?
1. ✅ Clear browser cache
2. ✅ Check both frontend and backend are running
3. ✅ Verify database connection
4. ✅ Check terminal for error messages

### Charts Not Showing?
- Charts appear when you have data
- Create some User Stories or BRDs first
- Refresh the page

## Support

### Common Questions

**Q: How much does the AI chatbot cost?**
A: Uses your OpenAI API credits. Pricing: ~$0.002 per conversation.

**Q: Can I use a different AI model?**
A: Yes! Edit `backend/src/controllers/chatController.js` and change the model parameter.

**Q: Is the chat history saved?**
A: Currently, history is in-memory only. It resets when you close the chat window.

**Q: Can I customize the chatbot responses?**
A: Yes! Edit the system prompt in `chatController.js` to customize behavior.

## Next Steps

1. **Explore the Dashboard** - Check out the new visual improvements
2. **Chat with AI** - Ask questions about business analysis
3. **Generate Content** - Use AI to create user stories and BRDs
4. **Provide Feedback** - Let us know what you think!

## Files Modified/Created

### New Files:
- ✅ `frontend/components/ChatBot.jsx` - Chatbot component
- ✅ `backend/src/controllers/chatController.js` - AI logic
- ✅ `backend/src/routes/chatRoutes.js` - API routes
- ✅ `AI_CHATBOT_IMPLEMENTATION.md` - Technical documentation
- ✅ `CHATBOT_QUICKSTART.md` - This file

### Modified Files:
- ✅ `frontend/app/dashboard/page.jsx` - Enhanced UI
- ✅ `backend/src/server.js` - Added chat routes
- ✅ `backend/.env` - Added OpenAI key

---

**Ready to start? Run the commands above and enjoy your enhanced Business Analyst Assistant! 🚀**
