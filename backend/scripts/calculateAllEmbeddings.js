/**
 * Standalone script to calculate embeddings for all users who are missing them
 * Run this script to ensure all users with preferences have embeddings
 * 
 * Usage: node backend/scripts/calculateAllEmbeddings.js [--force]
 *   --force: Regenerate embeddings even if they already exist
 */

const embeddingCalculationService = require("../services/embeddingCalculationService");

async function main() {
  const forceRegenerate = process.argv.includes('--force');
  
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🚀 Embedding Calculation Script");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Mode: ${forceRegenerate ? 'FORCE REGENERATE (all users)' : 'GENERATE MISSING ONLY'}\n`);
  
  try {
    const results = await embeddingCalculationService.calculateEmbeddingsForAllUsers(forceRegenerate);
    
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✨ Final Results");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Total users checked: ${results.total}`);
    console.log(`✅ Embeddings generated: ${results.generated}`);
    console.log(`⏭️  Skipped (already had embeddings): ${results.skipped}`);
    console.log(`❌ Errors: ${results.errors}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
    if (results.errors > 0) {
      console.log("⚠️  Some errors occurred. Check the logs above for details.");
      process.exit(1);
    } else {
      console.log("✅ All embeddings calculated successfully!");
      process.exit(0);
    }
    
  } catch (error) {
    console.error("\n❌ Fatal error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

