import { drizzle } from "drizzle-orm/sql-js";
import initSqlJs from "sql.js";
import { promises as fs } from "fs";
import path from "path";
import * as schema from "./schema";

const DB_PATH = path.join(process.cwd(), "nexusgraph.db");

async function runMigrations() {
  const SQL = await initSqlJs();
  
  // Load existing database or create new
  let data: Uint8Array;
  try {
    data = await fs.readFile(DB_PATH);
    console.log("Loaded existing database");
  } catch {
    data = new Uint8Array();
    console.log("Creating new database");
  }
  
  const sqlite = new SQL.Database(data);
  const db = drizzle(sqlite, { schema });
  
  // Run migration SQL directly
  const migrationSQL = `
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      type TEXT DEFAULT 'text' NOT NULL,
      source_url TEXT,
      word_count INTEGER DEFAULT 0,
      is_deleted INTEGER DEFAULT 0,
      is_starred INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
    
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT DEFAULT '#7C3AED'
    );
    
    CREATE TABLE IF NOT EXISTS document_tags (
      document_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );
    
    CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id INTEGER NOT NULL,
      target_id INTEGER NOT NULL,
      context TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (source_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (target_id) REFERENCES documents(id) ON DELETE CASCADE
    );
    
    CREATE TABLE IF NOT EXISTS sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      config TEXT,
      last_sync INTEGER,
      status TEXT DEFAULT 'pending',
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
    
    CREATE TABLE IF NOT EXISTS collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      is_auto INTEGER DEFAULT 0,
      auto_query TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
    
    CREATE TABLE IF NOT EXISTS document_collections (
      document_id INTEGER NOT NULL,
      collection_id INTEGER NOT NULL,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
    );
    
    CREATE TABLE IF NOT EXISTS search_index (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL UNIQUE,
      content TEXT,
      embedding TEXT,
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS documents_title_idx ON documents(title);
    CREATE INDEX IF NOT EXISTS documents_type_idx ON documents(type);
    CREATE INDEX IF NOT EXISTS links_source_idx ON links(source_id);
    CREATE INDEX IF NOT EXISTS links_target_idx ON links(target_id);
  `;
  
  sqlite.run(migrationSQL);
  
  // Save to file
  const savedData = sqlite.export();
  await fs.writeFile(DB_PATH, Buffer.from(savedData));
  
  console.log("Migrations completed successfully!");
  console.log("Database saved to:", DB_PATH);
}

runMigrations().catch(console.error);
