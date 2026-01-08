# Business Analyst Assistant Tool (BAT)

A professional enterprise-grade platform for Business Analysts to create and manage User Stories, generate BRDs using AI, manage templates and documents, draw workflows, integrate with Azure DevOps, and leverage OpenAI for intelligent features.

## 🚀 Features

### Core Modules
- **Dashboard**: Real-time analytics and statistics
- **User Stories Management**: Create, edit, and manage user stories with acceptance criteria
- **BRD Management**: AI-powered Business Requirements Document generation
- **Templates Management**: Reusable templates for consistent documentation
- **Documents Management**: Central repository with search and filtering
- **Diagrams & Workflows**: Visual diagram creation and management
- **Reports & Analytics**: Generate reports and export to PDF/Excel
- **AI Configuration**: Configurable OpenAI integration with custom prompts
- **Azure DevOps Integration**: Sync with Azure DevOps projects via PAT
- **System Settings**: User management, roles, permissions, and audit logs

### Authentication
- Multi-credential login (email, username, mobile)
- Secure password-based authentication
- JWT token-based session management
- Role-based access control

## 🏗️ Technology Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** (or SQLite for local development)
- **OpenAI API** for AI features
- **Azure DevOps REST APIs** for integration

### Frontend
- **Next.js 13+** (React framework)
- **Tailwind CSS** for responsive UI
- **Zustand** for state management
- **Axios** for API communication
- **Recharts** for data visualization

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ (or SQLite)
- OpenAI API Key
- Azure DevOps Personal Access Token (optional)

## 🔧 Installation

### 1. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/business_analyst_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=business_analyst_db
DB_USER=postgres
DB_PASSWORD=password

# Server
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRE=7d

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# Azure DevOps (optional)
AZURE_DEVOPS_BASE_URL=https://dev.azure.com
AZURE_DEVOPS_PAT=your_personal_access_token
AZURE_DEVOPS_ORGANIZATION=your_org_name
AZURE_DEVOPS_PROJECT=your_project_name

# CORS
CORS_ORIGIN=http://localhost:3000
```

**Run database migrations:**

```bash
npm run migrate
```

**Start the backend server:**

```bash
npm run dev
```

The backend will run on `http://localhost:3001`

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

**Start the frontend development server:**

```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## 🗄️ Database Schema

### Core Tables
- **users**: User accounts and profiles
- **user_stories**: User stories with acceptance criteria
- **brds**: Business Requirements Documents
- **templates**: Reusable templates
- **documents**: Document repository
- **diagrams**: Visual diagrams and workflows
- **reports**: Generated reports
- **ai_configurations**: AI model configurations per user
- **azure_devops_integrations**: Azure DevOps connection settings
- **audit_logs**: System activity logging
- **permissions**: Role-based permissions

## 🔐 Authentication Flow

1. User registers with email/username/mobile and password
2. Password is hashed with bcryptjs (10 salt rounds)
3. On login, credentials are validated
4. JWT token is generated (expires in 7 days by default)
5. Token is stored in localStorage on frontend
6. Token is sent in Authorization header for protected endpoints

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/register      - Register new user
POST   /api/auth/login         - User login
GET    /api/auth/me            - Get current user (protected)
```

### User Stories
```
POST   /api/user-stories       - Create story
GET    /api/user-stories       - List user's stories
GET    /api/user-stories/:id   - Get story details
PUT    /api/user-stories/:id   - Update story
DELETE /api/user-stories/:id   - Delete story
```

### BRDs
```
POST   /api/brds/generate      - Generate BRD from story (AI)
POST   /api/brds               - Create BRD manually
GET    /api/brds               - List BRDs
GET    /api/brds/:id           - Get BRD details
PUT    /api/brds/:id           - Update BRD
DELETE /api/brds/:id           - Delete BRD
POST   /api/brds/:id/comments  - Add BRD comment
GET    /api/brds/:id/comments  - Get BRD comments
```

### Templates
```
POST   /api/templates          - Create template
GET    /api/templates          - List templates
GET    /api/templates/:id      - Get template
PUT    /api/templates/:id      - Update template
DELETE /api/templates/:id      - Delete template
```

### Documents
```
POST   /api/documents          - Upload document
GET    /api/documents          - List documents
GET    /api/documents/:id      - Get document
PUT    /api/documents/:id      - Update document
DELETE /api/documents/:id      - Delete document
```

### Diagrams
```
POST   /api/diagrams           - Create diagram
GET    /api/diagrams           - List diagrams
GET    /api/diagrams/:id       - Get diagram
PUT    /api/diagrams/:id       - Update diagram
DELETE /api/diagrams/:id       - Delete diagram
```

### Reports
```
POST   /api/reports/generate   - Generate report
GET    /api/reports            - List reports
GET    /api/reports/:id        - Get report
GET    /api/reports/:id/export - Export report (PDF/Excel)
```

### AI Configuration
```
POST   /api/ai/configure       - Configure AI settings
GET    /api/ai/config          - Get AI configuration
```

### Azure DevOps
```
POST   /api/azure-devops/configure  - Configure Azure DevOps
GET    /api/azure-devops/config     - Get configuration
POST   /api/azure-devops/sync       - Sync with Azure DevOps
```

### Settings
```
GET    /api/settings/users           - List all users
PUT    /api/settings/users/role      - Update user role
PUT    /api/settings/users/deactivate - Deactivate user
GET    /api/settings/audit-logs      - Get audit logs
GET    /api/settings/system          - Get system settings
```

### Dashboard
```
GET    /api/dashboard/stats    - Get dashboard statistics
```

## 🎨 UI Components

### Navigation
- **Header**: Top navigation with user menu
- **Sidebar**: Main navigation menu with all modules
- **Modal**: Reusable modal dialog component

### Features
- Responsive design (mobile, tablet, desktop)
- Professional Tailwind CSS styling
- Real-time form validation
- Loading states and error handling
- Search and filter functionality
- Data visualization with charts

## 🚀 Quick Start

### 1. Start PostgreSQL (if using Docker)
```bash
docker run --name business-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:14
```

### 2. Start Backend
```bash
cd backend
npm install
npm run migrate
npm run dev
```

### 3. Start Frontend (in new terminal)
```bash
cd frontend
npm install
npm run dev
```

### 4. Open Application
Navigate to `http://localhost:3000` in your browser

### 5. Register & Login
- Create a new account with email/username/mobile
- Login with your credentials
- Start creating user stories and BRDs!

## 🔌 OpenAI Integration

### Configure OpenAI API Key
1. Get your API key from [OpenAI Dashboard](https://platform.openai.com/api-keys)
2. Add to backend `.env`:
   ```env
   OPENAI_API_KEY=sk-your-key-here
   ```
3. Use the "Generate BRD" feature with AI

### Customize AI Prompts
Navigate to **AI Config** module to customize:
- Prompt templates
- Language
- Detail level
- Temperature (creativity)
- Max tokens (response length)

## 🔗 Azure DevOps Integration

### Setup
1. Generate a Personal Access Token in Azure DevOps
2. Navigate to **Azure DevOps** module
3. Enter organization, project, and PAT
4. Click "Sync" to pull work items

### Features
- Sync Epics, Features, and User Stories
- Link BRDs to work items
- Track changes across platforms

## 📊 Reports & Analytics

### Available Reports
- User Stories by Status
- BRDs Overview
- Document Statistics
- System Analytics

### Export Formats
- PDF
- Excel
- JSON

## 🔐 Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Role-based access control (RBAC)
- Audit logging for all actions
- SQL injection prevention via parameterized queries
- CORS configuration
- Secure environment variable handling

## 📈 Scalability

- Modular architecture for easy feature additions
- Database indexing on frequently queried columns
- API response caching strategies
- Horizontal scaling ready
- Connection pooling for database

## 🐛 Troubleshooting

### Backend Issues

**Port 3001 already in use:**
```bash
lsof -i :3001
kill -9 <PID>
```

**Database connection error:**
- Check PostgreSQL is running
- Verify credentials in `.env`
- Ensure database exists

**OpenAI API errors:**
- Verify API key is valid
- Check account has available credits
- Review rate limits

### Frontend Issues

**Port 3000 already in use:**
```bash
kill -9 $(lsof -t -i:3000)
```

**API calls failing:**
- Ensure backend is running
- Check CORS_ORIGIN in backend `.env`
- Verify NEXT_PUBLIC_API_URL in frontend

## 🎯 Development Roadmap

- [ ] Advanced diagram editor with drag-and-drop
- [ ] Real-time collaboration features
- [ ] Webhook support for integrations
- [ ] Advanced reporting with custom metrics
- [ ] Mobile application
- [ ] Document version control
- [ ] Full-text search integration
- [ ] SSO integration (Azure AD, Google, GitHub)

## 📝 Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── controllers/      # Business logic
│   │   ├── routes/           # API endpoints
│   │   ├── middleware/       # Auth & validation
│   │   ├── services/         # External services
│   │   ├── db/              # Database setup
│   │   ├── utils/           # Utilities
│   │   └── server.js        # Express app
│   ├── uploads/             # File storage
│   └── package.json
│
├── frontend/
│   ├── app/
│   │   ├── (auth)/          # Auth pages
│   │   ├── dashboard/       # Protected routes
│   │   ├── globals.css      # Global styles
│   │   └── layout.jsx       # Root layout
│   ├── components/          # Reusable components
│   ├── lib/                 # API client
│   ├── store/               # State management
│   └── package.json
│
└── README.md
```

## 📄 License

MIT License - Feel free to use for personal or commercial projects

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ for Business Analysts**

Latest Updated: January 2026
>>>>>>> bc4e90c (chore: initial import)
