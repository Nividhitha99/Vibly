const getDb = require("../utils/db");
const cosineSimilarity = require("../utils/cosine");

exports.getMatches = async (userId) => {
  const db = await getDb();
  const allUsers = db.data.users;
  const allTastes = db.data.tastes;
  const allEmbeddings = db.data.embeddings;

  const currentEmbedding = allEmbeddings.find(e => e.userId === userId);
  if (!currentEmbedding || !currentEmbedding.vector || !Array.isArray(currentEmbedding.vector)) {
    console.log(`No embedding found for user ${userId} or embedding vector is missing`);
    return [];
  }

  const currentTaste = allTastes.find(t => t.userId === userId);
  if (!currentTaste) {
    console.log(`No taste data found for user ${userId}`);
    return [];
  }

  const results = [];

  for (let other of allEmbeddings) {
    if (other.userId === userId) continue;
    
    // Skip if other embedding doesn't have a vector
    if (!other.vector || !Array.isArray(other.vector)) continue;

    const otherTaste = allTastes.find(t => t.userId === other.userId);
    const otherUser = allUsers.find(u => u.id === other.userId);

    if (!otherTaste || !otherUser) continue;

    // -----------------------------------
    // REGION FILTER
    // -----------------------------------
    if (currentTaste.regionPreference === "same" && currentTaste.region) {
      if (otherTaste.region !== currentTaste.region) {
        continue; // skip this match entirely
      }
    }

    // -----------------------------------
    // COSINE SIMILARITY
    // -----------------------------------
    let score = cosineSimilarity(currentEmbedding.vector, other.vector);

    // -----------------------------------
    // LANGUAGE PREFERENCE FILTER
    // -----------------------------------
    if (currentTaste.preferredLanguages && Array.isArray(currentTaste.preferredLanguages) && currentTaste.preferredLanguages.length > 0) {
      const otherLanguages = Array.isArray(otherTaste.languages) ? otherTaste.languages : [];
      const overlap = otherLanguages.some(lang =>
        currentTaste.preferredLanguages.includes(lang)
      );

      if (!overlap) {
        score *= 0.7; // penalty when language mismatch
      }
    }

    // -----------------------------------
    // OVERLAP BOOSTS
    // -----------------------------------
    const currentMovies = Array.isArray(currentTaste.movies) ? currentTaste.movies : [];
    const otherMovies = Array.isArray(otherTaste.movies) ? otherTaste.movies : [];
    const sharedMovies = currentMovies.filter(m => otherMovies.includes(m)).length;

    const currentMusic = Array.isArray(currentTaste.music) ? currentTaste.music : [];
    const otherMusic = Array.isArray(otherTaste.music) ? otherTaste.music : [];
    const sharedMusic = currentMusic.filter(m => otherMusic.includes(m)).length;

    const currentShows = Array.isArray(currentTaste.shows) ? currentTaste.shows : [];
    const otherShows = Array.isArray(otherTaste.shows) ? otherTaste.shows : [];
    const sharedShows = currentShows.filter(s => otherShows.includes(s)).length;

    // Movie overlap boost
    if (sharedMovies >= 2) {
      score += 0.05;
    }

    // Music overlap boost
    if (sharedMusic >= 2) {
      score += 0.07;
    }

    // Show overlap boost
    if (sharedShows >= 2) {
      score += 0.04;
    }

    // -----------------------------------
    // PENALTIES
    // -----------------------------------
    if (sharedMovies === 0 && sharedMusic === 0 && sharedShows === 0) {
      score *= 0.6;
    }

    // -----------------------------------
    // ADD TO RESULTS
    // -----------------------------------
    results.push({
      userId: other.userId,
      name: otherUser?.name,
      email: otherUser?.email,
      score
    });
  }

  // Sort highest score first
  return results.sort((a, b) => b.score - a.score);
};
