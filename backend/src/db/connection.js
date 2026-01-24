require('dotenv').config();

let pool;
const dbType = process.env.DB_TYPE || 'sqlite';

if (dbType === 'sqlite') {
  // SQLite Setup
  const Database = require('better-sqlite3');
  const path = require('path');

  const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.db');
  const db = new Database(dbPath);

  // Enable foreign keys for SQLite
  db.pragma('foreign_keys = ON');

  // Create a wrapper to make SQLite behave like the PostgreSQL pool
  pool = {
    query: function (sql, params) {
      return new Promise((resolve, reject) => {
        try {
          // Convert PostgreSQL placeholders ($1, $2) to SQLite placeholders (?)
          let sqliteSql = sql;
          let paramArray = params || [];
          let returningClause = null;
          let isInsert = false;

          // Check if this is an INSERT statement
          if (sqliteSql.trim().toUpperCase().startsWith('INSERT')) {
            isInsert = true;
          }

          // Extract and remove RETURNING clause
          const returningMatch = sqliteSql.match(/RETURNING\s+(.+?)(?=\s*;?\s*$)/i);
          if (returningMatch) {
            returningClause = returningMatch[1];
            sqliteSql = sqliteSql.replace(/\s+RETURNING\s+.+$/i, '');
          }

          // Replace $1, $2, etc. with ? for SQLite
          const placeholderMatches = sql.match(/\$\d+/g) || [];
          console.log('[DEBUG] Found placeholders:', placeholderMatches, 'Parameter count:', paramArray.length);

          // Build new params array - map each placeholder occurrence to the corresponding parameter
          const newParams = [];
          placeholderMatches.forEach(match => {
            const paramIndex = parseInt(match.substring(1)) - 1;
            console.log('[DEBUG] Placeholder', match, '-> paramIndex', paramIndex, '-> value:', paramArray[paramIndex]);
            newParams.push(paramArray[paramIndex]);
          });

          sqliteSql = sql.replace(/\$\d+/g, '?');
          paramArray = newParams;

          console.log('[DEBUG] Final newParams:', newParams);
          console.log('[DEBUG] Converted to SQLite params:', paramArray);

          console.log('[DEBUG] Executing SQL:', sqliteSql.substring(0, 100), '...');

          // Handle different query types
          const queryType = sqliteSql.trim().toUpperCase().split(/\s+/)[0];

          if (queryType === 'SELECT') {
            const stmt = db.prepare(sqliteSql);
            const rows = stmt.all(...paramArray);
            console.log('[DEBUG] SELECT returned', rows.length, 'rows');
            resolve({ rows });
          } else if (isInsert) {
            const stmt = db.prepare(sqliteSql);
            const info = stmt.run(...paramArray);
            console.log('[DEBUG] INSERT completed, lastInsertRowid:', info.lastInsertRowid);

            // If RETURNING clause, fetch the inserted row
            if (returningClause) {
              try {
                // Extract table name from INSERT statement
                const tableMatch = sqliteSql.match(/INTO\s+(\w+)/i);
                if (tableMatch) {
                  const tableName = tableMatch[1];
                  const selectSql = `SELECT ${returningClause} FROM ${tableName} WHERE id = ?`;
                  console.log('[DEBUG] Fetching RETURNING with:', selectSql);
                  const selectStmt = db.prepare(selectSql);
                  const row = selectStmt.get(info.lastInsertRowid);
                  console.log('[DEBUG] RETURNING result:', row);
                  resolve({ rows: row ? [row] : [] });
                } else {
                  console.log('[DEBUG] Could not extract table name');
                  resolve({ rows: [{ id: info.lastInsertRowid }] });
                }
              } catch (e) {
                console.error('[DEBUG] Error fetching RETURNING:', e.message);
                resolve({ rows: [{ id: info.lastInsertRowid }] });
              }
            } else {
              resolve({ rows: [{ id: info.lastInsertRowid }] });
            }
          } else if (queryType === 'UPDATE' || queryType === 'DELETE') {
            let preDeleteRow = null;

            // For DELETE with RETURNING, fetch the row before deletion
            if (queryType === 'DELETE' && returningClause) {
              try {
                const tableMatch = sqliteSql.match(/FROM\s+(\w+)/i);
                if (tableMatch) {
                  const tableName = tableMatch[1];
                  const idParam = paramArray[paramArray.length - 1];
                  const selectSql = `SELECT ${returningClause} FROM ${tableName} WHERE id = ?`;
                  console.log('[DEBUG] Pre-fetching DELETE RETURNING with:', selectSql, 'id:', idParam);
                  const selectStmt = db.prepare(selectSql);
                  preDeleteRow = selectStmt.get(idParam) || null;
                }
              } catch (e) {
                console.error('[DEBUG] Error pre-fetching DELETE RETURNING:', e.message);
              }
            }

            const stmt = db.prepare(sqliteSql);
            const info = stmt.run(...paramArray);
            console.log('[DEBUG] UPDATE/DELETE affected', info.changes, 'rows');

            if (returningClause && queryType === 'UPDATE') {
              try {
                const tableMatch = sqliteSql.match(/UPDATE\s+(\w+)/i);
                if (tableMatch) {
                  const tableName = tableMatch[1];
                  // Assume last parameter is the primary key id (fits our usage)
                  const idParam = paramArray[paramArray.length - 1];
                  const selectSql = `SELECT ${returningClause} FROM ${tableName} WHERE id = ?`;
                  console.log('[DEBUG] Fetching UPDATE RETURNING with:', selectSql, 'id:', idParam);
                  const selectStmt = db.prepare(selectSql);
                  const row = selectStmt.get(idParam);
                  resolve({ rows: row ? [row] : [] });
                  return;
                }
              } catch (e) {
                console.error('[DEBUG] Error fetching UPDATE RETURNING:', e.message);
              }
            }

            if (returningClause && queryType === 'DELETE') {
              resolve({ rows: preDeleteRow ? [preDeleteRow] : [] });
              return;
            }

            resolve({ rows: [] });
          } else {
            const stmt = db.prepare(sqliteSql);
            const info = stmt.run(...paramArray);
            resolve({ rows: [] });
          }
        } catch (err) {
          console.error('[ERROR] Query failed:', err.message);
          console.error('[ERROR] SQL:', sql);
          reject(err);
        }
      });
    },
    connect: function () {
      return Promise.resolve();
    },
    end: function () {
      db.close();
      return Promise.resolve();
    }
  };

  console.log(`✅ Connected to SQLite database: ${dbPath}`);

  // Expose the raw database instance for direct better-sqlite3 usage
  pool.sqlite = db;
} else {
  // PostgreSQL Setup
  const { Pool } = require('pg');

  pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'business_analyst_db',
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });

  console.log('✅ Connected to PostgreSQL database');
}

module.exports = pool;
