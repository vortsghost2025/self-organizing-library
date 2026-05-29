#!/usr/bin/env node
/**
 * Initialize the observability database
 * This ensures the database file and tables are created.
 */

async function main() {
  try {
    const { getDb, saveDatabase } = await import('../src/db/index.js');
    console.log('Initializing observability database...');
    const db = await getDb();
    // Schema is created automatically in getDb
    await saveDatabase();
    console.log('✅ Observability database initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

main();
