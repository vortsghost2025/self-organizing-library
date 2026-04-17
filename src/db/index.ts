import { drizzle } from "drizzle-orm/sql-js";
import initSqlJs from "sql.js";
import * as schema from "./schema";
import { promises as fs } from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "nexusgraph.db");

let db: ReturnType<typeof drizzle> | null = null;

async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();
  
  // Try to load existing database
  let data: Uint8Array;
  try {
    data = await fs.readFile(DB_PATH);
  } catch {
    // Create new database
    data = new Uint8Array();
  }
  
  const sqlite = new SQL.Database(data);
  db = drizzle(sqlite, { schema });
  
  return db;
}

// Export async getter
export { getDb };

// For type exports
export type Database = ReturnType<typeof drizzle<typeof schema>>;
