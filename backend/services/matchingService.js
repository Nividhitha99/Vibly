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
    // OVERLAP BOOSTS (using API data)
    // -----------------------------------
    const currentMovies = Array.isArray(currentTaste.movies) ? currentTaste.movies : [];
    const otherMovies = Array.isArray(otherTaste.movies) ? otherTaste.movies : [];
    
    // Count exact matches (by ID)
    const sharedMovies = currentMovies.filter(m => {
      const movieId = typeof m === 'object' ? m.id : m;
      return otherMovies.some(om => {
        const otherId = typeof om === 'object' ? om.id : om;
        return movieId === otherId;
      });
    }).length;

    // Genre overlap for movies (if API data available)
    let movieGenreOverlap = 0;
    if (currentMovies.length > 0 && otherMovies.length > 0) {
      const currentGenres = new Set();
      const otherGenres = new Set();
      
      currentMovies.forEach(m => {
        if (typeof m === 'object' && m.genres && Array.isArray(m.genres)) {
          m.genres.forEach(g => currentGenres.add(g));
        }
      });
      
      otherMovies.forEach(m => {
        if (typeof m === 'object' && m.genres && Array.isArray(m.genres)) {
          m.genres.forEach(g => otherGenres.add(g));
        }
      });
      
      movieGenreOverlap = [...currentGenres].filter(g => otherGenres.has(g)).length;
    }

    const currentMusic = Array.isArray(currentTaste.music) ? currentTaste.music : [];
    const otherMusic = Array.isArray(otherTaste.music) ? otherTaste.music : [];
    
    // Count exact matches (by ID)
    const sharedMusic = currentMusic.filter(m => {
      const musicId = typeof m === 'object' ? m.id : m;
      return otherMusic.some(om => {
        const otherId = typeof om === 'object' ? om.id : om;
        return musicId === otherId;
      });
    }).length;

    // Genre overlap for music (artists)
    let musicGenreOverlap = 0;
    if (currentMusic.length > 0 && otherMusic.length > 0) {
      const currentGenres = new Set();
      const otherGenres = new Set();
      
      currentMusic.forEach(m => {
        if (typeof m === 'object' && m.genres && Array.isArray(m.genres)) {
          m.genres.forEach(g => currentGenres.add(g.toLowerCase()));
        }
      });
      
      otherMusic.forEach(m => {
        if (typeof m === 'object' && m.genres && Array.isArray(m.genres)) {
          m.genres.forEach(g => otherGenres.add(g.toLowerCase()));
        }
      });
      
      musicGenreOverlap = [...currentGenres].filter(g => otherGenres.has(g)).length;
    }

    const currentShows = Array.isArray(currentTaste.shows) ? currentTaste.shows : [];
    const otherShows = Array.isArray(otherTaste.shows) ? otherTaste.shows : [];
    
    // Count exact matches (by ID)
    const sharedShows = currentShows.filter(s => {
      const showId = typeof s === 'object' ? s.id : s;
      return otherShows.some(os => {
        const otherId = typeof os === 'object' ? os.id : os;
        return showId === otherId;
      });
    }).length;

    // Movie overlap boost
    if (sharedMovies >= 2) {
      score += 0.05;
    }
    // Movie genre overlap boost
    if (movieGenreOverlap >= 2) {
      score += 0.03;
    }

    // Music overlap boost
    if (sharedMusic >= 2) {
      score += 0.07;
    }
    // Music genre overlap boost
    if (musicGenreOverlap >= 2) {
      score += 0.04;
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
