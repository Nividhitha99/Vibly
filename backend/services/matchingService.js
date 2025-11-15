const db = require("../utils/db");
const cosine = require("../utils/cosine");

exports.getMatches = async (userId) => {
  const allUsers = db.data.users;
  const allTastes = db.data.tastes;
  const allEmbeddings = db.data.embeddings;

  const currentEmbedding = allEmbeddings.find(e => e.userId === userId);
  if (!currentEmbedding) return [];

  const currentTaste = allTastes.find(t => t.userId === userId);

  const results = [];

  for (let other of allEmbeddings) {
    if (other.userId === userId) continue;

    const otherTaste = allTastes.find(t => t.userId === other.userId);
    const otherUser = allUsers.find(u => u.id === other.userId);

    if (!otherTaste || !otherUser) continue;

    // -----------------------------------
    // REGION FILTER
    // -----------------------------------
    if (currentTaste.regionPreference === "same") {
      if (otherTaste.region !== currentTaste.region) {
        continue; // skip this match entirely
      }
    }

    // -----------------------------------
    // COSINE SIMILARITY
    // -----------------------------------
    let score = cosine(currentEmbedding.vector, other.vector);

    // -----------------------------------
    // LANGUAGE PREFERENCE FILTER
    // -----------------------------------
    if (currentTaste.preferredLanguages?.length > 0) {
      const overlap = otherTaste.languages?.some(lang =>
        currentTaste.preferredLanguages.includes(lang)
      );

      if (!overlap) {
        score *= 0.7; // penalty when language mismatch
      }
    }

    // -----------------------------------
    // OVERLAP BOOSTS
    // -----------------------------------
    const sharedMovies = currentTaste.movies.filter(m =>
      otherTaste.movies.includes(m)
    ).length;

    const sharedMusic = currentTaste.music.filter(m =>
      otherTaste.music.includes(m)
    ).length;

    const sharedShows = currentTaste.shows.filter(s =>
      otherTaste.shows.includes(s)
    ).length;

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
