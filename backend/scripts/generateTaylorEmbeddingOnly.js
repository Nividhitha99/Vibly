const getDb = require("../utils/db");
const embeddingService = require("../services/embeddingService");

async function generateTaylorEmbedding() {
  const db = await getDb();
  
  const taylorId = "e14d1480-aea9-4174-85d3-baf73992c2b6";
  const taylorTaste = db.data.tastes.find(t => t.userId === taylorId);
  const taylor = db.data.users.find(u => u.id === taylorId);
  
  if (!taylor) {
    console.log("❌ Taylor user not found");
    return;
  }
  
  if (!taylorTaste) {
    console.log("❌ Taylor has no taste preferences");
    return;
  }
  
  console.log(`🔄 Generating embedding for ${taylor.name}...`);
  console.log(`   Movies: ${taylorTaste.movies?.length || 0}`);
  console.log(`   Music: ${taylorTaste.music?.length || 0}`);
  console.log(`   Shows: ${taylorTaste.shows?.length || 0}\n`);
  
  try {
    await embeddingService.generateEmbedding(
      taylorId,
      taylorTaste.movies || [],
      taylorTaste.music || [],
      taylorTaste.shows || []
    );
    console.log(`✅ Successfully generated embedding for ${taylor.name}`);
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
  }
}

generateTaylorEmbedding().catch(console.error);

