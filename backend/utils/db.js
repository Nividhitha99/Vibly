const path = require("path");

let db = null;
let dbPromise = null;

async function getDb() {
  if (db) return db;
  
  if (!dbPromise) {
    dbPromise = (async () => {
      const { Low } = await import("lowdb");
      const { JSONFile } = await import("lowdb/node");
      
      const adapter = new JSONFile(path.join(__dirname, "../db.json"));
      const dbInstance = new Low(adapter, {
        users: [],
        tastes: [],
        embeddings: [],
        matches: [],
        messages: [],
        watchlist: [],
        followers: []
      });
      
      await dbInstance.read();
      dbInstance.data ||= {
        users: [],
        tastes: [],
        embeddings: [],
        matches: [],
        messages: [],
        watchlist: [],
        followers: []
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

