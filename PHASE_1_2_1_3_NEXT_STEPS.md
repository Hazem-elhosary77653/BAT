# Phase 1.2 & 1.3: Next Steps - User Story & Frontend AI Implementation

## 🎯 Executive Summary

**Phase 1.1 Status**: ✅ COMPLETE
- AI Configuration backend fully implemented
- BRD generation from stories fully implemented  
- Database schema created and tested
- All routes registered and validated

**Phase 1.2 Status**: 🔄 Ready to Start
- Implement AI-powered user story generation
- Create story refinement endpoints
- Implement story estimation

**Phase 1.3 Status**: 📋 Planned
- Build frontend AI configuration UI
- Create story generation interface
- Add BRD preview and export features

---

## 📋 Phase 1.2: AI-Powered Story Generator (3-4 days)

### What Needs to be Built

#### 1. User Story Generation Controller
**File**: `backend/src/controllers/userStoryGenerationController.js`  
**Purpose**: Handle AI-powered story generation and refinement

**Methods to Implement**:

```javascript
// POST /api/ai/generate-stories
exports.generateStoriesFromRequirements = async (req, res) => {
  // Input: requirementsText, projectId, count (2-10)
  // Process: 
  //   1. Get user's AI config
  //   2. Call aiService.generateStoriesFromRequirements()
  //   3. Parse response into structured stories
  //   4. Save to user_stories table
  //   5. Return array of generated stories
  // Output: Array of story objects
}

// POST /api/ai/refine-story
exports.refineStory = async (req, res) => {
  // Input: storyId, feedback
  // Process:
  //   1. Get story from database
  //   2. Call aiService.refineStory()
  //   3. Update story in database
  //   4. Create audit log
  // Output: Updated story
}

// POST /api/ai/estimate-story-points
exports.estimateStoryPoints = async (req, res) => {
  // Input: storyIds (array)
  // Process:
  //   1. Get stories from database
  //   2. Call aiService.estimateStoryPoints() for each
  //   3. Update user_stories with point estimates
  //   4. Log the action
  // Output: Stories with estimates
}

// GET /api/ai/templates
exports.getStoryTemplates = async (req, res) => {
  // Return: Predefined story templates
  // Templates: User story, Technical story, Bug report, Enhancement, etc.
}

// POST /api/ai/validate-story
exports.validateStory = async (req, res) => {
  // Input: story object
  // Process:
  //   1. Check for required fields
  //   2. Use AI to validate acceptance criteria quality
  //   3. Return validation report
  // Output: Validation results with suggestions
}
```

#### 2. User Story Generation Routes
**File**: `backend/src/routes/userStoryGenerationRoutes.js`  
**Endpoints**:
- `POST /api/ai/generate-stories` - Generate stories from requirements text
- `POST /api/ai/refine-story` - Refine an existing story
- `POST /api/ai/estimate-story-points` - Get AI estimates for stories
- `GET /api/ai/templates` - Get story templates
- `POST /api/ai/validate-story` - Validate story quality

#### 3. Story Templates Database
**File**: `backend/migrations/005_add_story_templates_table.js`

```javascript
// Table: story_templates
// Columns:
// - id (UUID)
// - name (e.g., "User Story", "Technical Task")
// - description
// - template_content (JSON with required fields)
// - fields_definition (which fields are required)
// - example (example story)
// - category (user-facing, technical, bug, enhancement)
// - is_default (boolean)

// Pre-populate with templates:
// 1. User Story Template
// 2. Technical Task Template
// 3. Bug Report Template
// 4. Enhancement Request Template
// 5. Documentation Template
```

### Implementation Details

#### Story Generation Flow
```
Requirements Text
    ↓
Validate text length (min 50, max 5000 chars)
    ↓
Get user's AI config
    ↓
Call aiService.generateStoriesFromRequirements()
    ↓
Parse AI response
    ↓
Validate each story
    ↓
Save to user_stories table
    ↓
Create audit log
    ↓
Return stories to user
```

#### Key Features to Implement
1. **Batch Generation**: Generate 2-10 stories at once
2. **Template Selection**: Use templates for consistent format
3. **Quality Validation**: Ensure all stories have required fields
4. **Cost Estimation**: Show token usage before generation
5. **Progress Tracking**: Show generation progress for large batches
6. **Undo/Rollback**: Ability to discard generated stories
7. **Feedback Loop**: Refine stories based on user feedback

### Files to Create
- [ ] `backend/src/controllers/userStoryGenerationController.js` (~400 lines)
- [ ] `backend/src/routes/userStoryGenerationRoutes.js` (~80 lines)
- [ ] `backend/migrations/005_add_story_templates_table.js` (~100 lines)
- [ ] `backend/seeds/storyTemplates.js` (template data)

---

## 📋 Phase 1.3: Frontend AI Configuration UI (2-3 days)

### What Needs to be Built

#### 1. AI Configuration Page
**File**: `frontend/app/dashboard/ai-config/page.jsx`

**Sections**:
1. **API Key Input**
   - Input field (masked)
   - Visibility toggle button
   - Copy button for testing
   - Clear/Reset button

2. **Model Selection**
   - Dropdown for model selection
   - Model descriptions
   - Pricing info (if available)

3. **Generation Parameters**
   - Temperature slider (0-2, default 0.7)
   - Max tokens slider (100-4000, default 3000)
   - Language selector
   - Detail level selector

4. **Connection Test**
   - Test button
   - Connection status indicator
   - Available models display
   - Error messages

5. **Preset Configurations**
   - Quick presets for different use cases:
     - Detailed (high token, high temp)
     - Standard (default)
     - Brief (low token, lower temp)
     - Technical (for technical stories)

6. **Settings History**
   - View previous configurations
   - Rollback to previous settings

#### 2. Story Generation Page
**File**: `frontend/app/dashboard/ai-stories/page.jsx`

**Sections**:
1. **Requirements Input**
   - Large text area for requirements
   - Character counter
   - Template selector
   - Generation options

2. **Generation Controls**
   - Number of stories slider (2-10)
   - Language selector
   - Template selector
   - Generate button with loading state

3. **Results Display**
   - Generated stories in cards
   - Edit inline capability
   - Save/Discard buttons
   - Preview before save

4. **Refinement Tools**
   - Select story
   - Feedback input
   - Refine button
   - Show diff between old and new

#### 3. Components to Create
- `AIConfigForm.jsx` - API key and settings form
- `ModelSelector.jsx` - Model dropdown with info
- `ParameterSliders.jsx` - Reusable sliders for temp, tokens
- `ConnectionStatus.jsx` - Status indicator
- `StoryGenerator.jsx` - Requirements input and generation
- `GeneratedStoryCard.jsx` - Display single generated story
- `StoryRefiner.jsx` - Refinement feedback form
- `TemplateSelector.jsx` - Choose story template

#### 4. Hook for AI Management
**File**: `frontend/hooks/useAIConfig.js`

```javascript
// Custom hook for AI configuration management
export function useAIConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);

  // Methods:
  // getConfig() - Fetch current config
  // updateConfig(newConfig) - Update settings
  // testConnection(apiKey) - Test API key
  // resetConfig() - Reset to defaults
  // getModels() - Get available models

  return {
    config,
    loading,
    getConfig,
    updateConfig,
    testConnection,
    resetConfig,
    getModels,
  };
}
```

#### 5. Hook for Story Generation
**File**: `frontend/hooks/useStoryGeneration.js`

```javascript
// Custom hook for AI story generation
export function useStoryGeneration() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Methods:
  // generateStories(requirementsText, options) - Generate new stories
  // refineStory(storyId, feedback) - Refine story
  // estimatePoints(storyIds) - Get point estimates
  // getTemplates() - Get available templates
  // validateStory(story) - Validate story quality
  // saveStory(story) - Save to database
  // discardStories() - Clear generated stories

  return {
    stories,
    loading,
    generateStories,
    refineStory,
    estimatePoints,
    getTemplates,
    validateStory,
    saveStory,
    discardStories,
  };
}
```

### Implementation Details

#### AI Configuration Page Flow
```
User Visits /dashboard/ai-config
    ↓
Load existing config (if any)
    ↓
Display form with current values
    ↓
User enters/updates API key
    ↓
User adjusts parameters
    ↓
User clicks "Test Connection"
    ↓
Call POST /api/ai-config/test
    ↓
Show test result and available models
    ↓
User clicks "Save Configuration"
    ↓
Call PUT /api/ai-config
    ↓
Show success message
    ↓
Refresh dashboard with AI features unlocked
```

#### Story Generation Page Flow
```
User Visits /dashboard/ai-stories
    ↓
Check if AI config is set up
    ↓
Display requirements input form
    ↓
User enters requirements and selects options
    ↓
User clicks "Generate Stories"
    ↓
Call POST /api/ai/generate-stories
    ↓
Show generation progress (with spinner)
    ↓
Display generated stories in cards
    ↓
User can:
    - Edit each story inline
    - Request refinement
    - Get estimate
    - Save selected stories
    - Discard all
```

### Files to Create
- [ ] `frontend/app/dashboard/ai-config/page.jsx` (~200 lines)
- [ ] `frontend/app/dashboard/ai-stories/page.jsx` (~250 lines)
- [ ] `frontend/components/AIConfigForm.jsx` (~150 lines)
- [ ] `frontend/components/StoryGenerator.jsx` (~200 lines)
- [ ] `frontend/components/GeneratedStoryCard.jsx` (~100 lines)
- [ ] `frontend/hooks/useAIConfig.js` (~80 lines)
- [ ] `frontend/hooks/useStoryGeneration.js` (~100 lines)
- [ ] `frontend/styles/ai-dashboard.css` (~150 lines)

---

## 📊 Detailed Implementation Timeline

### Phase 1.2: AI Story Generator (Days 1-4)

**Day 1: Backend Setup (4 hours)**
- [ ] Create userStoryGenerationController.js
- [ ] Create userStoryGenerationRoutes.js
- [ ] Create story templates migration
- [ ] Create template seeder
- [ ] Test all endpoints with Postman

**Day 2: Service Integration (4 hours)**
- [ ] Implement generateStoriesFromRequirements in aiService
- [ ] Implement refineStory in aiService
- [ ] Implement estimateStoryPoints in aiService
- [ ] Add error handling and logging
- [ ] Create unit tests

**Day 3: Database & Validation (4 hours)**
- [ ] Add story quality validation
- [ ] Create story templates table
- [ ] Populate template data
- [ ] Test generation flow end-to-end
- [ ] Performance testing with batch generation

**Day 4: Testing & Documentation (4 hours)**
- [ ] Write API documentation
- [ ] Create Postman collection
- [ ] Write usage guide
- [ ] Fix any bugs found during testing
- [ ] Performance optimization

### Phase 1.3: Frontend UI (Days 5-7)

**Day 5: AI Configuration UI (4 hours)**
- [ ] Create AIConfigForm component
- [ ] Create ModelSelector component
- [ ] Create ParameterSliders component
- [ ] Create test connection button
- [ ] Implement form validation

**Day 6: Story Generation UI (4 hours)**
- [ ] Create StoryGenerator component
- [ ] Create GeneratedStoryCard component
- [ ] Create StoryRefiner component
- [ ] Implement generation flow UI
- [ ] Add loading states and spinners

**Day 7: Integration & Polish (4 hours)**
- [ ] Create useAIConfig hook
- [ ] Create useStoryGeneration hook
- [ ] Integrate with Zustand store
- [ ] Add error handling and notifications
- [ ] User testing and refinement

---

## 🔄 Integration Checklist

### Backend Integration
- [ ] User story generation endpoints working
- [ ] Story templates seeded in database
- [ ] AI estimation working correctly
- [ ] All endpoints returning correct format
- [ ] Error handling for edge cases
- [ ] Audit logging working
- [ ] Rate limiting configured

### Frontend Integration
- [ ] AI config page loads and saves
- [ ] Test connection button works
- [ ] Story generation page shows results
- [ ] Generated stories can be edited
- [ ] Stories can be saved to database
- [ ] Navigation to AI features visible
- [ ] State management working

### E2E Testing
- [ ] User can set AI config from UI
- [ ] User can generate stories from requirements
- [ ] User can refine generated stories
- [ ] User can get point estimates
- [ ] User can export stories to various formats
- [ ] User can view generation history
- [ ] User can manage templates

---

## 📦 Dependencies Check

### Backend Dependencies
```json
{
  "openai": "^3.2.1",           // Already installed
  "better-sqlite3": "^8.0.0",   // Already installed
  "express-validator": "^7.0.0", // Already installed
  "pdfkit": "^0.13.0",          // Already installed
  "crypto": "built-in"           // Built-in Node.js module
}
```

### Frontend Dependencies
```json
{
  "zustand": "^4.3.0",          // Already installed
  "react": "^18.0.0",           // Already installed
  "axios": "^1.0.0",            // For API calls
  "react-toastify": "^9.0.0",   // For notifications
  "zustand": "^4.3.0"           // State management
}
```

### Optional Additions
```json
{
  "docx": "^8.0.0",             // For DOCX export
  "html2pdf": "^0.10.1",        // For PDF export
  "react-markdown": "^8.0.0",   // For markdown preview
  "markdown-it": "^13.0.0"      // For markdown parsing
}
```

---

## 🚀 Deployment Checklist

### Before Deployment
- [ ] All tests passing
- [ ] Database migrations run
- [ ] Environment variables configured
- [ ] API key encryption working
- [ ] Error handling in place
- [ ] Logging configured
- [ ] Performance tested

### Deployment Steps
```bash
# 1. Run database migration
node backend/migrations/005_add_story_templates_table.js

# 2. Seed templates
node backend/seeds/storyTemplates.js

# 3. Install new dependencies (if any)
npm install

# 4. Run backend tests
npm test

# 5. Start backend
npm start

# 6. Build frontend
npm run build

# 7. Start frontend
npm start
```

---

## 📝 Quick Reference

### Key API Endpoints (Phase 1.2)

```
POST /api/ai/generate-stories
  Body: { requirementsText, projectId?, count?, language?, template? }
  Returns: [{ id, title, description, acceptance_criteria, priority, points_estimate }]

POST /api/ai/refine-story
  Body: { storyId, feedback }
  Returns: { updated story }

POST /api/ai/estimate-story-points
  Body: { storyIds: [id1, id2, ...] }
  Returns: { storyId: points, ... }

GET /api/ai/templates
  Returns: [{ id, name, description, example, fields }]

POST /api/ai/validate-story
  Body: { story object }
  Returns: { isValid, suggestions, score }
```

### Frontend Routes (Phase 1.3)
```
/dashboard/ai-config         - AI Configuration page
/dashboard/ai-stories        - Story Generation page
/dashboard/ai-brd            - BRD Generation page (existing)
/dashboard/ai-templates      - Template Management page
```

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue**: AI stories generation fails
- Check API key is valid
- Check API quota and rate limits
- Verify requirements text is valid (50-5000 chars)
- Check OpenAI service status

**Issue**: Frontend can't connect to API
- Verify CORS is configured
- Check API URL is correct
- Verify JWT token is valid
- Check browser console for errors

**Issue**: Database migrations fail
- Ensure database.db exists
- Check file permissions
- Verify SQLite is installed
- Check migration syntax

---

**Current Status**: Phase 1.1 COMPLETE ✅  
**Next**: Phase 1.2 AI Story Generation Ready to Start 🚀  
**Timeline**: 1 week for Phases 1.2 + 1.3  
**Priority**: HIGH - Core AI features for user value

---

Generated: 2024  
Version: 1.0
