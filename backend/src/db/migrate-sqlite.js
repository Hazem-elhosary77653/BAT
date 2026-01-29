const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();
const { flattenRolePermissions } = require('../utils/permissionChecker');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

const migrate = async () => {
  try {
    console.log(`Starting SQLite migration to ${dbPath}...`);

    // Users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email VARCHAR(255) UNIQUE,
        username VARCHAR(255) UNIQUE,
        mobile VARCHAR(20) UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role VARCHAR(50) DEFAULT 'analyst',
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Story Groups table
    db.exec(`
      CREATE TABLE IF NOT EXISTS story_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        color VARCHAR(20),
        position INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // User Stories table
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_stories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        group_id INTEGER,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        acceptance_criteria TEXT,
        priority VARCHAR(50),
        status VARCHAR(50) DEFAULT 'draft',
        tags TEXT,
        azure_devops_id VARCHAR(100),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (group_id) REFERENCES story_groups(id) ON DELETE SET NULL
      )
    `);

    // BRD Documents table (updated to support UUIDs and correct naming)
    db.exec(`
      CREATE TABLE IF NOT EXISTS brd_documents (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        version INTEGER DEFAULT 1,
        status VARCHAR(50) DEFAULT 'draft',
        assigned_to INTEGER,
        request_review_at DATETIME,
        approved_at DATETIME,
        approved_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (assigned_to) REFERENCES users(id),
        FOREIGN KEY (approved_by) REFERENCES users(id)
      )
    `);

    // BRD Versions table
    db.exec(`
      CREATE TABLE IF NOT EXISTS brd_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        brd_id TEXT NOT NULL,
        content TEXT,
        version_number INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (brd_id) REFERENCES brd_documents(id) ON DELETE CASCADE
      )
    `);

    // BRD Workflow History table (for tracking status transitions)
    db.exec(`
      CREATE TABLE IF NOT EXISTS brd_workflow_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        brd_id TEXT NOT NULL,
        from_status VARCHAR(50),
        to_status VARCHAR(50) NOT NULL,
        changed_by INTEGER NOT NULL,
        reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (brd_id) REFERENCES brd_documents(id) ON DELETE CASCADE,
        FOREIGN KEY (changed_by) REFERENCES users(id)
      )
    `);

    // BRD Review Assignments table (for assigning reviewers)
    db.exec(`
      CREATE TABLE IF NOT EXISTS brd_review_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        brd_id TEXT NOT NULL,
        assigned_to INTEGER NOT NULL,
        assigned_by INTEGER NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        comment TEXT,
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        reviewed_at DATETIME,
        FOREIGN KEY (brd_id) REFERENCES brd_documents(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_to) REFERENCES users(id),
        FOREIGN KEY (assigned_by) REFERENCES users(id),
        UNIQUE(brd_id, assigned_to)
      )
    `);

    // BRD Collaborators table (for sharing with specific users)
    db.exec(`
      CREATE TABLE IF NOT EXISTS brd_collaborators (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        brd_id TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        permission_level VARCHAR(50) DEFAULT 'view',
        added_by INTEGER NOT NULL,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (brd_id) REFERENCES brd_documents(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (added_by) REFERENCES users(id),
        UNIQUE(brd_id, user_id)
      )
    `);

    // BRD Comments (Section-level comments for collaboration)
    db.exec(`
      CREATE TABLE IF NOT EXISTS brd_section_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        brd_id TEXT NOT NULL,
        section_heading VARCHAR(255),
        comment_text TEXT NOT NULL,
        commented_by INTEGER NOT NULL,
        status VARCHAR(50) DEFAULT 'open',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME,
        resolved_by INTEGER,
        FOREIGN KEY (brd_id) REFERENCES brd_documents(id) ON DELETE CASCADE,
        FOREIGN KEY (commented_by) REFERENCES users(id),
        FOREIGN KEY (resolved_by) REFERENCES users(id)
      )
    `);

    // Templates table (Refined)
    db.exec(`
      CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        content TEXT NOT NULL,
        category VARCHAR(50) DEFAULT 'brd', -- brd, story, document, email
        variables TEXT, -- JSON array of variable names like ["project_name", "target_audience"]
        is_public BOOLEAN DEFAULT 0,
        usage_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Documents table
    db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        file_path VARCHAR(255) NOT NULL,
        file_type VARCHAR(50),
        file_size INTEGER,
        tags TEXT,
        access_level VARCHAR(50) DEFAULT 'private',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Diagrams table
    db.exec(`
      CREATE TABLE IF NOT EXISTS diagrams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        diagram_data TEXT,
        diagram_type VARCHAR(100),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Reports table
    db.exec(`
      CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        report_type VARCHAR(100),
        report_data TEXT,
        generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        exported_format VARCHAR(50),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // AI Configurations table
    db.exec(`
      CREATE TABLE IF NOT EXISTS ai_configurations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        api_key TEXT,
        model TEXT DEFAULT 'gpt-3.5-turbo',
        temperature REAL DEFAULT 0.7,
        max_tokens INTEGER DEFAULT 3000,
        language TEXT DEFAULT 'en',
        detail_level TEXT DEFAULT 'standard',
        prompt_template TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Azure DevOps Integrations table
    db.exec(`
      CREATE TABLE IF NOT EXISTS azure_devops_integrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        organization VARCHAR(255) NOT NULL,
        project VARCHAR(255) NOT NULL,
        pat_token_hash VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        last_synced DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // AI Stories table (for extracted stories from BRDs)
    db.exec(`
      CREATE TABLE IF NOT EXISTS ai_stories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        acceptance_criteria TEXT,
        priority VARCHAR(50) DEFAULT 'P2',
        estimated_points INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // BRD Analysis storage
    db.exec(`
      CREATE TABLE IF NOT EXISTS brd_analysis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        brd_id TEXT NOT NULL,
        score INTEGER,
        risk_level VARCHAR(50),
        summary TEXT,
        strengths TEXT, -- JSON
        gaps TEXT,      -- JSON
        suggestions TEXT, -- JSON
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(brd_id),
        FOREIGN KEY (brd_id) REFERENCES brd_documents(id) ON DELETE CASCADE
      )
    `);

    // Audit Logs table
    db.exec(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action VARCHAR(255) NOT NULL,
        entity_type VARCHAR(100),
        entity_id INTEGER,
        old_values TEXT,
        new_values TEXT,
        ip_address VARCHAR(50),
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Permissions table
    db.exec(`
      CREATE TABLE IF NOT EXISTS permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role VARCHAR(50) NOT NULL,
        action VARCHAR(100) NOT NULL,
        resource VARCHAR(100) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(role, action, resource)
      )
    `);

    // Seed permissions from the role matrix
    const permissionRows = flattenRolePermissions();
    const insertPermission = db.prepare(`
      INSERT OR IGNORE INTO permissions (role, action, resource)
      VALUES (?, ?, ?)
    `);

    permissionRows.forEach(({ role, action, resource }) => {
      insertPermission.run(role, action, resource);
    });

    // Activity Logs table
    db.exec(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        action_type VARCHAR(100) NOT NULL,
        description TEXT,
        ip_address VARCHAR(50),
        user_agent TEXT,
        resource_type VARCHAR(100),
        resource_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Password Reset Tokens table
    db.exec(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        used_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // User Sessions table
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        ip_address VARCHAR(50),
        user_agent TEXT,
        login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
        logout_time DATETIME,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // User 2FA table
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_2fa (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        secret VARCHAR(255) NOT NULL,
        is_enabled BOOLEAN DEFAULT 0,
        backup_codes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // User Groups table
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        created_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // User Group Members table
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_group_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role VARCHAR(50) DEFAULT 'member',
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES user_groups(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(group_id, user_id)
      )
    `);

    // User Notes table
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255),
        content TEXT,
        color VARCHAR(50) DEFAULT '#ffffff',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed test users
    const bcrypt = require('bcryptjs');
    const testUsers = [
      { email: 'admin@example.com', username: 'admin', mobile: '+1111111111', password: 'password123', firstName: 'Admin', lastName: 'User', role: 'admin' },
      { email: 'analyst@example.com', username: 'analyst', mobile: '+1222222222', password: 'password123', firstName: 'Analyst', lastName: 'User', role: 'analyst' },
      { email: 'viewer@example.com', username: 'viewer', mobile: '+1333333333', password: 'password123', firstName: 'Viewer', lastName: 'User', role: 'viewer' }
    ];

    // Seed initial templates
    const seedTemplates = [
      {
        id: 'tpl-brd-pro-001',
        name: 'Professional BRD',
        description: 'Standard enterprise BRD template with all essential sections.',
        category: 'brd',
        content: '# Project: {{project_name}}\n\n## 1. Executive Summary\n{{summary}}\n\n## 2. Business Goals\n{{goals}}\n\n## 3. Functional Requirements\n{{functional_reqs}}\n\n## 4. Non-Functional Requirements\n{{non_functional_reqs}}\n\n## 5. Stakeholders\n{{stakeholders}}'
      },
      {
        id: 'tpl-story-agile-001',
        name: 'Agile User Story',
        description: 'Perfect for standard agile development workflows.',
        category: 'story',
        content: 'As a {{user_role}}, I want to {{action}}, so that {{benefit}}.\n\n### Acceptance Criteria\n- {{criteria_1}}\n- {{criteria_2}}'
      }
    ];

    const insertTemplate = db.prepare(`
      INSERT OR IGNORE INTO templates (id, user_id, name, description, content, category, is_public)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);

    seedTemplates.forEach(tpl => {
      insertTemplate.run(tpl.id, '16', tpl.name, tpl.description, tpl.content, tpl.category);
    });

    for (const user of testUsers) {
      try {
        const hashedPassword = bcrypt.hashSync(user.password, 10);
        const insertStmt = db.prepare(`
          INSERT OR IGNORE INTO users (email, username, mobile, password_hash, first_name, last_name, role, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        `);
        insertStmt.run(user.email, user.username, user.mobile, hashedPassword, user.firstName, user.lastName, user.role);
      } catch (err) {
        console.log(`Note: User ${user.email} might already exist`);
      }
    }

    console.log('✅ SQLite database migration completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration error:', err);
    process.exit(1);
  }
};

migrate();
