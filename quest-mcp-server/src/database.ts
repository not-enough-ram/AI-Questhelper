import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataDir = join(__dirname, '..', 'data');

// Ensure data directory exists
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, 'quest.db');
export const db: Database.Database = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

/**
 * Initialize database schema
 * Safe to call multiple times - uses IF NOT EXISTS
 */
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS npcs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      location TEXT,
      player_disposition INTEGER DEFAULT 0,
      notes TEXT DEFAULT '',
      metadata TEXT DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS quests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT CHECK(status IN ('available','active','completed')) DEFAULT 'available',
      metadata TEXT DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS relationships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type_a TEXT NOT NULL,
      entity_id_a INTEGER NOT NULL,
      relationship_type TEXT NOT NULL,
      entity_type_b TEXT NOT NULL,
      entity_id_b INTEGER NOT NULL,
      strength INTEGER DEFAULT 0,
      metadata TEXT DEFAULT '{}'
    );

    CREATE INDEX IF NOT EXISTS idx_relationships_a 
      ON relationships(entity_type_a, entity_id_a);
    CREATE INDEX IF NOT EXISTS idx_relationships_b 
      ON relationships(entity_type_b, entity_id_b);
  `);
  
  console.error('Database initialized at:', dbPath);
}