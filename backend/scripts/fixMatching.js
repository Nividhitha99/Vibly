const getDb = require("../utils/db");
const embeddingService = require("../services/embeddingService");

async function fixMatching() {
  const db = await getDb();
  
  console.log("🔧 FIXING MATCHING SYSTEM\n");
  console.log("=".repeat(50));
  
  // Step 1: Check current state
  const allUsers = db.data.users || [];
  const allTastes = db.data.tastes || [];
  const allEmbeddings = db.data.embeddings || [];
  
  console.log(`\n📊 Current State:`);
  console.log(`   Users: ${allUsers.length}`);
  console.log(`   Users with preferences: ${allTastes.length}`);
  console.log(`   Users with embeddings: ${allEmbeddings.filter(e => e.vector && Array.isArray(e.vector)).length}`);
  
  // Step 2: Find users missing embeddings
  const usersNeedingEmbeddings = [];
  for (const user of allUsers) {
    const taste = allTastes.find(t => t.userId === user.id);
    const embedding = allEmbeddings.find(e => e.userId === user.id);
    
    if (taste && (!embedding || !embedding.vector || !Array.isArray(embedding.vector))) {
      const hasPreferences = (taste.movies?.length || 0) > 0 || 
                            (taste.music?.length || 0) > 0 || 
                            (taste.shows?.length || 0) > 0;
      if (hasPreferences) {
        usersNeedingEmbeddings.push({ user, taste });
      }
    }
  }
  
  console.log(`\n🔍 Found ${usersNeedingEmbeddings.length} users needing embeddings:`);
  usersNeedingEmbeddings.forEach(({ user }) => {
    console.log(`   - ${user.name} (${user.id})`);
  });
  
  if (usersNeedingEmbeddings.length === 0) {
    console.log("\n✅ All users have embeddings! Matching should work.");
    return;
  }
  
  // Step 3: Generate embeddings
  console.log(`\n🔄 Generating embeddings...\n`);
  let success = 0;
  let failed = 0;
  
  for (const { user, taste } of usersNeedingEmbeddings) {
    try {
      console.log(`Generating for ${user.name}...`);
      await embeddingService.generateEmbedding(
        user.id,
        taste.movies || [],
        taste.music || [],
        taste.shows || []
      );
      console.log(`✅ ${user.name} - Success\n`);
      success++;
    } catch (error) {
      console.error(`❌ ${user.name} - Failed: ${error.message}\n`);
      failed++;
    }
  }
  
  console.log("=".repeat(50));
  console.log(`\n📊 Results:`);
  console.log(`   ✅ Generated: ${success}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`\n✨ Done! Try viewing matches now.`);
}

fixMatching().catch(console.error);

