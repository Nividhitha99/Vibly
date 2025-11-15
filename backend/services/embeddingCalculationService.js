/**
 * Embedding Calculation Service
 * Automatically calculates embeddings for users when:
 * - User is created/updated
 * - Preferences are saved/updated
 * - Called from mock data scripts
 * 
 * This ensures all users have embeddings for matching.
 */

const embeddingService = require("./embeddingService");
const tasteService = require("./tasteService");
const getDb = require("../utils/db");

/**
 * Calculate embedding for a user if they have preferences
 * @param {string} userId - User ID
 * @param {boolean} forceRegenerate - Force regeneration even if embedding exists
 * @returns {Promise<boolean>} - True if embedding was generated/updated
 */
exports.calculateEmbeddingForUser = async (userId, forceRegenerate = false) => {
  try {
    console.log(`[EmbeddingCalculation] 🔍 Checking embedding for user: ${userId}`);
    
    // Check if user already has an embedding
    if (!forceRegenerate) {
      const db = await getDb();
      const existingEmbedding = db.data.embeddings?.find(e => e.userId === userId);
      
      if (existingEmbedding && existingEmbedding.vector && Array.isArray(existingEmbedding.vector) && existingEmbedding.vector.length > 0) {
        console.log(`[EmbeddingCalculation] ✓ User ${userId} already has an embedding (${existingEmbedding.vector.length} dimensions)`);
        return true; // Already has embedding
      }
    }
    
    // Get user's taste preferences
    const taste = await tasteService.getTaste(userId);
    
    if (!taste) {
      console.log(`[EmbeddingCalculation] ⚠️ No taste preferences found for user ${userId} - skipping embedding`);
      return false;
    }
    
    const movies = taste.movies || [];
    const music = taste.music || [];
    const shows = taste.shows || [];
    
    // Check if user has any preferences
    if (movies.length === 0 && music.length === 0 && shows.length === 0) {
      console.log(`[EmbeddingCalculation] ⚠️ User ${userId} has no preferences (movies: ${movies.length}, music: ${music.length}, shows: ${shows.length}) - skipping embedding`);
      return false;
    }
    
    console.log(`[EmbeddingCalculation] 📊 Generating embedding for user ${userId}:`);
    console.log(`   Movies: ${movies.length}, Music: ${music.length}, Shows: ${shows.length}`);
    
    // Generate embedding
    try {
      await embeddingService.generateEmbedding(userId, movies, music, shows);
      console.log(`[EmbeddingCalculation] ✅ Successfully generated embedding for user ${userId}`);
      return true;
    } catch (embeddingError) {
      console.error(`[EmbeddingCalculation] ❌ Error generating embedding for user ${userId}:`, embeddingError.message);
      // Don't throw - just log the error
      return false;
    }
    
  } catch (error) {
    console.error(`[EmbeddingCalculation] ❌ Fatal error calculating embedding for user ${userId}:`, error.message);
    return false;
  }
};

/**
 * Calculate embeddings for all users who are missing them
 * @param {boolean} forceRegenerate - Force regeneration for all users
 * @returns {Promise<{total: number, generated: number, skipped: number, errors: number}>}
 */
exports.calculateEmbeddingsForAllUsers = async (forceRegenerate = false) => {
  try {
    console.log(`\n[EmbeddingCalculation] 🚀 Starting bulk embedding calculation (forceRegenerate: ${forceRegenerate})...\n`);
    
    const db = await getDb();
    const allUsers = db.data.users || [];
    const allTastes = db.data.tastes || [];
    const allEmbeddings = db.data.embeddings || [];
    
    console.log(`[EmbeddingCalculation] Found ${allUsers.length} users, ${allTastes.length} taste profiles, ${allEmbeddings.length} existing embeddings`);
    
    const results = {
      total: 0,
      generated: 0,
      skipped: 0,
      errors: 0
    };
    
    for (const user of allUsers) {
      results.total++;
      const userId = user.id;
      
      // Check if user has preferences
      const taste = allTastes.find(t => t.userId === userId);
      if (!taste) {
        console.log(`[${results.total}/${allUsers.length}] ⏭️  Skipping ${user.name || userId} - no preferences`);
        results.skipped++;
        continue;
      }
      
      const movies = taste.movies || [];
      const music = taste.music || [];
      const shows = taste.shows || [];
      
      if (movies.length === 0 && music.length === 0 && shows.length === 0) {
        console.log(`[${results.total}/${allUsers.length}] ⏭️  Skipping ${user.name || userId} - empty preferences`);
        results.skipped++;
        continue;
      }
      
      // Check if embedding already exists
      if (!forceRegenerate) {
        const existingEmbedding = allEmbeddings.find(e => e.userId === userId);
        if (existingEmbedding && existingEmbedding.vector && Array.isArray(existingEmbedding.vector) && existingEmbedding.vector.length > 0) {
          console.log(`[${results.total}/${allUsers.length}] ✓ ${user.name || userId} already has embedding`);
          results.skipped++;
          continue;
        }
      }
      
      // Generate embedding
      console.log(`[${results.total}/${allUsers.length}] 🧠 Generating embedding for ${user.name || userId}...`);
      const success = await exports.calculateEmbeddingForUser(userId, forceRegenerate);
      
      if (success) {
        results.generated++;
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        results.errors++;
      }
    }
    
    console.log(`\n[EmbeddingCalculation] ✨ Bulk calculation complete!`);
    console.log(`   Total users: ${results.total}`);
    console.log(`   Generated: ${results.generated}`);
    console.log(`   Skipped: ${results.skipped}`);
    console.log(`   Errors: ${results.errors}\n`);
    
    return results;
    
  } catch (error) {
    console.error(`[EmbeddingCalculation] ❌ Fatal error in bulk calculation:`, error.message);
    throw error;
  }
};

/**
 * Ensure embedding exists for a user (called after preferences are saved or profile is updated)
 * This is the main entry point for automatic embedding calculation
 * @param {string} userId - The user ID
 * @param {boolean} forceRegenerate - If true, regenerates even if embedding exists (default: true for preferences updates)
 */
exports.ensureEmbeddingForUser = async (userId, forceRegenerate = true) => {
  // Run asynchronously to not block the request
  setImmediate(async () => {
    try {
      console.log(`[EmbeddingCalculation] 🔄 Ensuring embedding for user ${userId} (forceRegenerate: ${forceRegenerate})`);
      await exports.calculateEmbeddingForUser(userId, forceRegenerate);
      console.log(`[EmbeddingCalculation] ✅ Embedding ensured for user ${userId}`);
    } catch (error) {
      console.error(`[EmbeddingCalculation] ❌ Error in ensureEmbeddingForUser for ${userId}:`, error.message);
      // Don't throw - this runs in background
    }
  });
};

module.exports = exports;

