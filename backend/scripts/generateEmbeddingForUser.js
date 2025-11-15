const embeddingService = require("../services/embeddingService");
const tasteService = require("../services/tasteService");
const getDb = require("../utils/db");

async function generateEmbeddingForUser(userId) {
  try {
    console.log(`\n🔍 Generating embedding for user: ${userId}\n`);
    
    // Get user's taste preferences
    const taste = await tasteService.getTaste(userId);
    
    if (!taste) {
      console.error(`❌ No taste preferences found for user ${userId}`);
      console.log(`💡 User needs to set preferences first before embedding can be generated.`);
      return;
    }
    
    const movies = taste.movies || [];
    const music = taste.music || [];
    const shows = taste.shows || [];
    
    console.log(`📊 Found preferences:`);
    console.log(`   Movies: ${movies.length}`);
    console.log(`   Music: ${music.length}`);
    console.log(`   Shows: ${shows.length}`);
    
    if (movies.length === 0 && music.length === 0 && shows.length === 0) {
      console.error(`❌ User has no preferences. Cannot generate embedding.`);
      return;
    }
    
    console.log(`\n🧠 Generating embedding using Gemini AI...`);
    await embeddingService.generateEmbedding(userId, movies, music, shows);
    
    console.log(`\n✅ Embedding generated successfully for user ${userId}!`);
    
  } catch (error) {
    console.error(`\n❌ Error generating embedding:`, error.message);
    console.error(error.stack);
  }
}

// Get userId from command line argument
const userId = process.argv[2];

if (!userId) {
  console.error("Usage: node generateEmbeddingForUser.js <userId>");
  console.error("\nExample: node generateEmbeddingForUser.js 4cbc95e0-bcec-40b3-9d8d-1c11816c81b3");
  process.exit(1);
}

generateEmbeddingForUser(userId)
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Fatal error:", error);
    process.exit(1);
  });

