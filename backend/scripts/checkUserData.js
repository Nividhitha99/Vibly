const getDb = require("../utils/db");

async function checkUserData() {
  const db = await getDb();
  
  const userId = process.argv[2] || "18ec8fd8-1953-4f63-981a-34f9621b5391";
  
  console.log(`\nChecking data for user: ${userId}\n`);
  
  const user = db.data.users.find(u => u.id === userId);
  if (user) {
    console.log("✓ User found:");
    console.log(`  Name: ${user.name}`);
    console.log(`  Email: ${user.email}`);
  } else {
    console.log("✗ User not found");
  }
  
  const taste = db.data.tastes.find(t => t.userId === userId);
  if (taste) {
    console.log("\n✓ Taste preferences found:");
    console.log(`  Movies: ${taste.movies?.length || 0}`);
    console.log(`  Music: ${taste.music?.length || 0}`);
    console.log(`  Shows: ${taste.shows?.length || 0}`);
  } else {
    console.log("\n✗ No taste preferences found");
  }
  
  const embedding = db.data.embeddings.find(e => e.userId === userId);
  if (embedding && embedding.vector && Array.isArray(embedding.vector)) {
    console.log("\n✓ Embedding found:");
    console.log(`  Vector length: ${embedding.vector.length}`);
  } else {
    console.log("\n✗ No embedding found or embedding is invalid");
  }
  
  console.log("\n📊 Database Summary:");
  console.log(`  Total users: ${db.data.users.length}`);
  console.log(`  Total tastes: ${db.data.tastes.length}`);
  console.log(`  Total embeddings: ${db.data.embeddings.length}`);
  
  console.log("\n📋 All users with embeddings:");
  db.data.embeddings.forEach(e => {
    const u = db.data.users.find(us => us.id === e.userId);
    console.log(`  - ${u?.name || 'Unknown'} (${e.userId})`);
  });
}

checkUserData().catch(console.error);

