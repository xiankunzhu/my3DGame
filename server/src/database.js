/**
 * ============================================
 * Database Setup (SQLite via better-sqlite3)
 * ============================================
 * Creates and manages the SQLite database for:
 * - User accounts (login/registration)
 * - High scores and game statistics
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/game.db');

let db;

/**
 * Get the database instance (singleton pattern)
 */
function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL'); // Better performance for concurrent reads
  }
  return db;
}

/**
 * Initialize the database tables if they don't exist
 */
function initializeDatabase() {
  const database = getDb();

  // ---- Users Table ----
  // Stores player account information
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `);

  // ---- High Scores Table ----
  // Stores individual game scores linked to users
  database.exec(`
    CREATE TABLE IF NOT EXISTS high_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      score INTEGER NOT NULL,
      enemies_killed INTEGER DEFAULT 0,
      survival_time INTEGER DEFAULT 0,
      played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // ---- Index for faster leaderboard queries ----
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_scores_score ON high_scores(score DESC)
  `);

  console.log('✅ Database initialized successfully');
}

module.exports = { getDb, initializeDatabase };
