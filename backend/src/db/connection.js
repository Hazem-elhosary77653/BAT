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
          let isUpdate = false;
          let isDelete = false;

          // Replace $1, $2, etc. with ? for SQLite and align params
          const placeholderMatches = sqliteSql.match(/\$\d+/g) || [];
          const newParams = [];
          placeholderMatches.forEach(match => {
            const paramIndex = parseInt(match.substring(1)) - 1;
            newParams.push(paramArray[paramIndex]);
          });

          // Only replace if we found $ placeholders
          if (placeholderMatches.length > 0) {
            sqliteSql = sqliteSql.replace(/\$\d+/g, '?');
            paramArray = newParams;
          }

          // Postgres-to-SQLite type/syntax conversion
          sqliteSql = sqliteSql
            .replace(/SERIAL PRIMARY KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT')
            .replace(/TIMESTAMP DEFAULT CURRENT_TIMESTAMP/gi, 'DATETIME DEFAULT CURRENT_TIMESTAMP')
            .replace(/DEFAULT CURRENT_TIMESTAMP/gi, 'DEFAULT CURRENT_TIMESTAMP')
            .replace(/ON CONFLICT .* DO NOTHING/gi, '')
            .replace(/TEXT\[\]/gi, 'TEXT'); // SQLite doesn't have arrays

          const normalizedSql = sqliteSql.trim().toUpperCase();
          if (normalizedSql.startsWith('INSERT')) isInsert = true;
          if (normalizedSql.startsWith('UPDATE')) isUpdate = true;
          if (normalizedSql.startsWith('DELETE')) isDelete = true;

          // Extract and remove RETURNING clause if SQLite doesn't support it natively or we want to emulate
          const returningMatch = sqliteSql.match(/RETURNING\s+(.+?)(?=\s*;?\s*$)/i);
          if (returningMatch) {
            returningClause = returningMatch[1];
            sqliteSql = sqliteSql.replace(/\s+RETURNING\s+.+$/i, '');
          }

          console.log('[DEBUG] SQLite SQL:', sqliteSql);

          if (normalizedSql.startsWith('SELECT')) {
            const stmt = db.prepare(sqliteSql);
            const rows = stmt.all(...paramArray);
            resolve({ rows });
          } else if (isInsert) {
            const stmt = db.prepare(sqliteSql);
            const info = stmt.run(...paramArray);

            if (returningClause) {
              const tableMatch = sqliteSql.match(/INTO\s+(\w+)/i);
              if (tableMatch) {
                const tableName = tableMatch[1];
                const selectSql = `SELECT ${returningClause} FROM ${tableName} WHERE rowid = ?`;
                const row = db.prepare(selectSql).get(info.lastInsertRowid);
                resolve({ rows: row ? [row] : [] });
              } else {
                resolve({ rows: [{ id: info.lastInsertRowid }] });
              }
            } else {
              resolve({ rows: [{ id: info.lastInsertRowid }] });
            }
          } else if (isUpdate || isDelete) {
            // Emulate RETURNING for UPDATE/DELETE
            let affectedRows = [];
            if (returningClause) {
              try {
                // This is a simplified emulation that assumes the last param is the ID
                // or we can try to find the ID from the query.
                // For our project, most UPDATE/DELETEs end with "WHERE id = $X"
                const tableMatch = sqliteSql.match(/(?:UPDATE|FROM)\s+(\w+)/i);
                if (tableMatch) {
                  const tableName = tableMatch[1];

                  // Smarter ID parameter detection: look for "id = $X" in the original SQL
                  let idParam = paramArray[paramArray.length - 1]; // Default to last param
                  const idMatch = sql.match(/id\s*=\s*\$(\d+)/i);
                  if (idMatch) {
                    const idIndex = parseInt(idMatch[1]) - 1;
                    if (idIndex >= 0 && idIndex < params.length) {
                      idParam = params[idIndex];
                    }
                  }

                  const selectSql = `SELECT ${returningClause} FROM ${tableName} WHERE id = ?`;
                  const row = db.prepare(selectSql).get(idParam);
                  if (row) affectedRows.push(row);
                }
              } catch (e) {
                console.error('[DEBUG] RETURNING emulation failed:', e.message);
              }
            }

            const stmt = db.prepare(sqliteSql);
            const info = stmt.run(...paramArray);

            if (returningClause) {
              resolve({ rows: affectedRows });
            } else {
              resolve({ rows: [], changes: info.changes });
            }
          } else {
            const stmt = db.prepare(sqliteSql);
            const info = stmt.run(...paramArray);
            resolve({ rows: [], changes: info.changes });
          }
        } catch (err) {
          console.error('[ERROR] Query failed:', err.message);
          console.error('[ERROR] Original SQL:', sql);
          reject(err);
        }
      });
    },
    connect: function () {
      return Promise.resolve({
        query: (sql, params) => pool.query(sql, params),
        release: () => Promise.resolve()
      });
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
