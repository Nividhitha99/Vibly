const path = require("path");

let db = null;
let dbPromise = null;

async function getDb() {
  if (db) return db;
  
  if (!dbPromise) {
    dbPromise = (async () => {
      const { Low } = await import("lowdb");
      const { JSONFile } = await import("lowdb/node");
      const fs = await import("fs");
      
      // Use environment variable for database path (for cloud deployments)
      // Default to backend/db.json for local development
      const dbPath = process.env.DB_PATH || path.join(__dirname, "../db.json");
      const dbDir = path.dirname(dbPath);
      
      // Ensure directory exists
      try {
        if (!fs.existsSync(dbDir)) {
          fs.mkdirSync(dbDir, { recursive: true });
        }
      } catch (err) {
        console.warn(`[DB] Could not create directory ${dbDir}:`, err.message);
      }
      
      const adapter = new JSONFile(dbPath);
      const dbInstance = new Low(adapter, {
        users: [],
        tastes: [],
        embeddings: [],
        matches: [],
        messages: [],
        watchlist: [],
        followers: [],
        notifications: []
      });
      
      await dbInstance.read();
      dbInstance.data ||= {
        users: [],
        tastes: [],
        embeddings: [],
        matches: [],
        messages: [],
        watchlist: [],
        followers: [],
        notifications: []
      };
      
      db = dbInstance;
      return db;
    })();
  }
  
  return await dbPromise;
}

// Initialize immediately
getDb().catch(err => {
  console.error("Failed to initialize database:", err);
});

module.exports = getDb;

