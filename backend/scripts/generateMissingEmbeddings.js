const getDb = require("../utils/db");
const embeddingService = require("../services/embeddingService");

async function generateMissingEmbeddings() {
  const db = await getDb();
  
  const allUsers = db.data.users || [];
  const allTastes = db.data.tastes || [];
  const allEmbeddings = db.data.embeddings || [];
  
  console.log(`Checking ${allUsers.length} users for missing embeddings...\n`);
  
  let generated = 0;
  let skipped = 0;
  let failed = 0;
  
  for (const user of allUsers) {
    const userId = user.id;
    
    // Check if user has taste preferences
    const taste = allTastes.find(t => t.userId === userId);
    if (!taste) {
      console.log(`⏭️  Skipping ${user.name} (${userId}) - no taste preferences`);
      skipped++;
      continue;
    }
    
    // Check if user already has an embedding
    const existingEmbedding = allEmbeddings.find(e => e.userId === userId);
    if (existingEmbedding && existingEmbedding.vector && Array.isArray(existingEmbedding.vector)) {
      console.log(`✓ ${user.name} already has an embedding`);
      continue;
    }
    
    // User has preferences but no embedding - generate one
    const movies = taste.movies || [];
    const music = taste.music || [];
    const shows = taste.shows || [];
    
    if (movies.length === 0 && music.length === 0 && shows.length === 0) {
      console.log(`⏭️  Skipping ${user.name} - preferences are empty`);
      skipped++;
      continue;
    }
    
    console.log(`\n🔄 Generating embedding for ${user.name} (${userId})...`);
    console.log(`   Movies: ${movies.length}, Music: ${music.length}, Shows: ${shows.length}`);
    
    try {
      await embeddingService.generateEmbedding(userId, movies, music, shows);
      console.log(`✅ Successfully generated embedding for ${user.name}\n`);
      generated++;
    } catch (error) {
      console.error(`❌ Failed to generate embedding for ${user.name}:`, error.message);
      failed++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Generated: ${generated}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`\n✨ Done!`);
}

generateMissingEmbeddings().catch(console.error);

