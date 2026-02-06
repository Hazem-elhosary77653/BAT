const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();
const db = require('./db/connection');
const { initializeEmailService } = require('./services/emailService');
const { validateEnv } = require('./utils/validateEnv');
const { syncPermissions } = require('./utils/permissionSeeder');
const aiService = require('./services/aiService');

const app = express();
app.use('/api/notification-email', require('./routes/notificationEmailRoutes'));

// Validate environment and initialize services
validateEnv();
initializeEmailService();

// Initialize OpenAI - Try to load from database first, fallback to env
const initializeAI = async () => {
  try {
    // Try to get API key from database (for any user with admin role or first user)
    const result = db.sqlite.prepare('SELECT api_key FROM ai_configurations LIMIT 1').get();
    
    if (result && result.api_key) {
      aiService.initializeOpenAI(result.api_key);
      console.log('✅ OpenAI service initialized from database');
    } else if (process.env.OPENAI_API_KEY) {
      aiService.initializeOpenAI(process.env.OPENAI_API_KEY);
      console.log('✅ OpenAI service initialized from environment');
    } else {
      console.warn('⚠️ OpenAI API key not found. AI features will require configuration.');
    }
  } catch (error) {
    if (process.env.OPENAI_API_KEY) {
      aiService.initializeOpenAI(process.env.OPENAI_API_KEY);
      console.log('✅ OpenAI service initialized from environment');
    } else {
      console.warn('⚠️ Failed to load OpenAI configuration:', error.message);
    }
  }
};

initializeAI();

syncPermissions().catch((err) => {
  console.error('[PERMISSIONS] Startup sync failed:', err.message);
});

// Create uploads directories if they don't exist
const uploadsDir = path.join(__dirname, '../uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');
[uploadsDir, avatarsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Middleware
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (corsOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  }
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request Logging Middleware for debugging
app.use((req, res, next) => {
  console.log(`[API Request] ${req.method} ${req.path}`);
  next();
});

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Apply session timeout middleware to all API routes
const sessionTimeoutMiddleware = require('./middleware/sessionTimeoutMiddleware');
app.use('/api', sessionTimeoutMiddleware);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userManagementRoutes'));
app.use('/api/profile', require('./routes/userProfileRoutes'));
app.use('/api/activity', require('./routes/activityRoutes'));
app.use('/api/password-reset', require('./routes/passwordResetRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));
app.use('/api/permissions', require('./routes/permissionsRoutes'));
app.use('/api/sessions', require('./routes/sessionManagementRoutes'));
app.use('/api/user-stories', require('./routes/userStoriesRoutes'));
app.use('/api/brd', require('./routes/brdRoutes'));
app.use('/api/ai-config', require('./routes/aiConfigRoutes'));
app.use('/api/ai/stories', require('./routes/aiStoryRoutes'));
app.use('/api/templates', require('./routes/templatesRoutes'));
app.use('/api/documents', require('./routes/documentsRoutes'));
app.use('/api/diagrams', require('./routes/diagramRoutes'));
app.use('/api/wireframes', require('./routes/wireframeRoutes'));
app.use('/api/reports', require('./routes/reportsRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/ai', require('./routes/chatRoutes'));
app.use('/api/azure-devops', require('./routes/azureDevOpsRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/user-settings', require('./routes/userSettingsRoutes'));
app.use('/api/system-settings', require('./routes/systemSettingsRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/test', require('./routes/testRoutes'));
app.use('/api/openai', require('./routes/openaiRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/notes', require('./routes/noteRoutes'));
app.use('/api/collaboration', require('./routes/collaborationRoutes'));
app.use('/api', require('./routes/highlightsRoutes'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// WebSocket Setup for Real-time Collaboration
const httpServer = http.createServer(app);
const io = socketIo(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  path: '/socket.io/'
});

// Initialize WebSocket handlers
const WebSocketHandler = require('./services/websocketHandler');
const wsHandler = new WebSocketHandler(io);
wsHandler.initialize();

console.log('✅ WebSocket Server initialized');

// Initialize database migrations for collaboration
const { migrateCollaboration } = require('./db/migrations/010_add_collaboration_tables');
try {
  const migrationResult = migrateCollaboration();
  if (migrationResult.success) {
    console.log('✅ Collaboration tables initialized');
  }
} catch (error) {
  console.warn('⚠️ Collaboration migration warning:', error.message);
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket available at ws://localhost:${PORT}/socket.io/`);
});
