const getDb = require("../utils/db");
const cosineSimilarity = require("../utils/cosine");

// Helper function to calculate age from birthday
function calculateAge(birthday) {
  if (!birthday) return null;
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Helper function to generate match reasons
function generateMatchReasons(currentTaste, otherTaste, currentProfile, otherProfile, sharedMovies, sharedMusic, sharedShows) {
  const reasons = [];
  
  // Movie reasons
  if (sharedMovies >= 2) {
    reasons.push({
      type: "movies",
      message: `You both love ${sharedMovies} of the same movies`,
      strength: "strong"
    });
  } else if (sharedMovies === 1) {
    reasons.push({
      type: "movies",
      message: `You both love the same movie`,
      strength: "medium"
    });
  }
  
  // Music reasons
  if (sharedMusic >= 2) {
    reasons.push({
      type: "music",
      message: `You both listen to ${sharedMusic} of the same artists`,
      strength: "strong"
    });
  } else if (sharedMusic === 1) {
    reasons.push({
      type: "music",
      message: `You both listen to the same artist`,
      strength: "medium"
    });
  }
  
  // TV Show reasons
  if (sharedShows >= 2) {
    reasons.push({
      type: "shows",
      message: `You both watch ${sharedShows} of the same TV shows`,
      strength: "strong"
    });
  } else if (sharedShows === 1) {
    reasons.push({
      type: "shows",
      message: `You both watch the same TV show`,
      strength: "medium"
    });
  }
  
  // Personality reasons
  if (currentProfile?.dominantTraits && otherProfile?.dominantTraits) {
    const currentTraits = new Set(currentProfile.dominantTraits.map(t => t.toLowerCase()));
    const otherTraits = new Set(otherProfile.dominantTraits.map(t => t.toLowerCase()));
    const commonTraits = [...currentTraits].filter(t => otherTraits.has(t));
    
    if (commonTraits.length >= 2) {
      reasons.push({
        type: "personality",
        message: `Similar personality traits: ${commonTraits.slice(0, 2).join(", ")}`,
        strength: "strong"
      });
    }
  }
  
  return reasons;
}

// Helper function to calculate compatibility breakdown
function calculateCompatibilityBreakdown(baseScore, sharedMovies, sharedMusic, sharedShows, personalityBoost, culturalBoost) {
  const total = baseScore + personalityBoost + culturalBoost + 
                (sharedMovies > 0 ? 0.08 : 0) + 
                (sharedMusic > 0 ? 0.07 : 0) + 
                (sharedShows > 0 ? 0.04 : 0);
  
  if (total === 0) return { movies: 0, music: 0, shows: 0, personality: 0, cultural: 0, base: 0 };
  
  return {
    base: Math.round((baseScore / total) * 100),
    movies: Math.round(((sharedMovies > 0 ? 0.08 : 0) / total) * 100),
    music: Math.round(((sharedMusic > 0 ? 0.07 : 0) / total) * 100),
    shows: Math.round(((sharedShows > 0 ? 0.04 : 0) / total) * 100),
    personality: Math.round((personalityBoost / total) * 100),
    cultural: Math.round((culturalBoost / total) * 100)
  };
}

exports.getMatches = async (userId, options = {}) => {
  const db = await getDb();
  const allUsers = db.data.users;
  const allTastes = db.data.tastes;
  const allEmbeddings = db.data.embeddings;

  console.log(`[Enhanced Matching] Finding matches for user ${userId}`);

  // Get user match settings
  let matchSettings = null;
  if (db.data.userMatchSettings) {
    matchSettings = db.data.userMatchSettings.find(s => s.userId === userId);
  }
  
  // Default settings
  const settings = matchSettings || {
    minAge: 18,
    maxAge: 100,
    preferredGenders: [],
    minScore: 0,
    maxDailyMatches: 50,
    weights: { movies: 0.4, music: 0.4, shows: 0.2 }
  };

  // Check cache first
  const cacheKey = `matches_${userId}`;
  if (db.data.matchCache) {
    const cached = db.data.matchCache.find(c => c.userId === userId && c.key === cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      console.log(`[Enhanced Matching] Using cached matches for ${userId}`);
      // Still filter by daily limit and interactions
      return await applyFilters(cached.matches, userId, settings, db);
    }
  }

  const currentEmbedding = allEmbeddings.find(e => e.userId === userId);
  if (!currentEmbedding || !currentEmbedding.vector || !Array.isArray(currentEmbedding.vector)) {
    console.log(`[Enhanced Matching] No embedding found for user ${userId}`);
    console.log(`[Enhanced Matching] User has taste data: ${!!currentTaste}`);
    if (currentTaste) {
      console.log(`[Enhanced Matching] User has ${currentTaste.movies?.length || 0} movies, ${currentTaste.music?.length || 0} music, ${currentTaste.shows?.length || 0} shows`);
      console.log(`[Enhanced Matching] ⚠️  WARNING: User has preferences but no embedding! Run generateMissingEmbeddings.js to fix this.`);
    }
    return [];
  }

  const currentTaste = allTastes.find(t => t.userId === userId);
  if (!currentTaste) {
    console.log(`[Enhanced Matching] No taste data found for user ${userId}`);
    return [];
  }

  const currentUser = allUsers.find(u => u.id === userId);
  if (!currentUser) {
    console.log(`[Enhanced Matching] Current user not found`);
    return [];
  }

  // Get already-interacted users (liked, passed, matched)
  const likedUsers = new Set();
  const passedUsers = new Set();
  const matchedUsers = new Set();

  if (db.data.matches) {
    db.data.matches.forEach(m => {
      if (m.fromUser === userId) {
        if (m.status === "confirmed") {
          matchedUsers.add(m.toUser);
        } else {
          likedUsers.add(m.toUser);
        }
      }
      if (m.toUser === userId && m.status === "confirmed") {
        matchedUsers.add(m.fromUser);
      }
    });
  }

  if (db.data.passes) {
    db.data.passes.forEach(p => {
      if (p.fromUser === userId) {
        passedUsers.add(p.toUser);
      }
    });
  }

  console.log(`[Enhanced Matching] Excluding ${likedUsers.size} liked, ${passedUsers.size} passed, ${matchedUsers.size} matched users`);

  const results = [];
  const seenEmbeddingUserIds = new Set();
  const uniqueEmbeddings = [];

  // Remove duplicate embeddings
  for (const emb of allEmbeddings) {
    if (!emb.userId) continue;
    const normalizedId = String(emb.userId).trim();
    if (!seenEmbeddingUserIds.has(normalizedId)) {
      seenEmbeddingUserIds.add(normalizedId);
      uniqueEmbeddings.push(emb);
    }
  }

  for (let other of uniqueEmbeddings) {
    if (other.userId === userId) continue;
    if (!other.vector || !Array.isArray(other.vector)) continue;

    const otherTaste = allTastes.find(t => t.userId === other.userId);
    const otherUser = allUsers.find(u => u.id === other.userId);

    if (!otherTaste || !otherUser) continue;

    // FILTER 1: Skip already-interacted users
    if (likedUsers.has(other.userId) || passedUsers.has(other.userId) || matchedUsers.has(other.userId)) {
      continue;
    }

    // FILTER 2: Age filter
    const otherAge = calculateAge(otherUser.birthday);
    if (otherAge !== null) {
      if (otherAge < settings.minAge || otherAge > settings.maxAge) {
        continue;
      }
    }

    // FILTER 3: Gender filter
    if (settings.preferredGenders && settings.preferredGenders.length > 0) {
      if (!settings.preferredGenders.includes(otherUser.gender)) {
        continue;
      }
    }

    // FILTER 4: Region filter
    if (currentTaste.regionPreference === "same" && currentTaste.region) {
      if (otherTaste.region !== currentTaste.region) {
        continue;
      }
    }

    // Calculate compatibility score
    const currentProfile = currentEmbedding.psychologicalProfile || {};
    const otherProfile = other.psychologicalProfile || {};

    let baseScore = cosineSimilarity(currentEmbedding.vector, other.vector);
    let personalityBoost = 0;
    let culturalBoost = 0;

    // Personality matching
    if (currentProfile.dominantTraits && otherProfile.dominantTraits) {
      const currentTraits = new Set(currentProfile.dominantTraits.map(t => t.toLowerCase()));
      const otherTraits = new Set(otherProfile.dominantTraits.map(t => t.toLowerCase()));
      const traitOverlap = [...currentTraits].filter(t => otherTraits.has(t)).length;
      const totalUniqueTraits = new Set([...currentTraits, ...otherTraits]).size;
      const traitSimilarity = totalUniqueTraits > 0 ? traitOverlap / totalUniqueTraits : 0;
      
      if (traitSimilarity > 0.3) {
        personalityBoost = traitSimilarity * 0.15;
      }
    }

    // Cultural matching
    if (currentProfile.culturalProfile && otherProfile.culturalProfile) {
      const currentCultures = new Set((currentProfile.culturalProfile.preferredCultures || []).map(c => c.toLowerCase()));
      const otherCultures = new Set((otherProfile.culturalProfile.preferredCultures || []).map(c => c.toLowerCase()));
      if (currentCultures.size > 0 && otherCultures.size > 0) {
        const culturalOverlap = [...currentCultures].filter(c => otherCultures.has(c)).length;
        const totalUniqueCultures = new Set([...currentCultures, ...otherCultures]).size;
        const culturalSimilarity = totalUniqueCultures > 0 ? culturalOverlap / totalUniqueCultures : 0;
        if (culturalSimilarity > 0) {
          culturalBoost = culturalSimilarity * 0.12;
        }
      }
    }

    // Calculate shared preferences
    const currentMovies = Array.isArray(currentTaste.movies) ? currentTaste.movies : [];
    const otherMovies = Array.isArray(otherTaste.movies) ? otherTaste.movies : [];
    const sharedMovies = currentMovies.filter(m => {
      const movieId = typeof m === 'object' ? m.id : m;
      return otherMovies.some(om => {
        const otherId = typeof om === 'object' ? om.id : om;
        return movieId === otherId;
      });
    }).length;

    const currentMusic = Array.isArray(currentTaste.music) ? currentTaste.music : [];
    const otherMusic = Array.isArray(otherTaste.music) ? otherTaste.music : [];
    const sharedMusic = currentMusic.filter(m => {
      const musicId = typeof m === 'object' ? m.id : m;
      return otherMusic.some(om => {
        const otherId = typeof om === 'object' ? om.id : om;
        return musicId === otherId;
      });
    }).length;

    const currentShows = Array.isArray(currentTaste.shows) ? currentTaste.shows : [];
    const otherShows = Array.isArray(otherTaste.shows) ? otherTaste.shows : [];
    const sharedShows = currentShows.filter(s => {
      const showId = typeof s === 'object' ? s.id : s;
      return otherShows.some(os => {
        const otherId = typeof os === 'object' ? os.id : os;
        return showId === otherId;
      });
    }).length;

    // Apply user-defined weights
    const movieWeight = settings.weights?.movies || 0.4;
    const musicWeight = settings.weights?.music || 0.4;
    const showsWeight = settings.weights?.shows || 0.2;

    let score = baseScore;
    score += personalityBoost;
    score += culturalBoost;
    
    // Weighted preference boosts (more lenient - even 1 shared item helps)
    if (sharedMovies >= 1) score += 0.05 * movieWeight; // Lowered threshold from 2 to 1
    if (sharedMovies >= 2) score += 0.03 * movieWeight; // Additional boost for 2+
    if (sharedMusic >= 1) score += 0.04 * musicWeight;
    if (sharedMusic >= 2) score += 0.03 * musicWeight;
    if (sharedShows >= 1) score += 0.03 * showsWeight;
    if (sharedShows >= 2) score += 0.01 * showsWeight;

    // Penalties (less harsh)
    if (sharedMovies === 0 && sharedMusic === 0 && sharedShows === 0) {
      score *= 0.8; // Less penalty (was 0.6)
    }

    // FILTER 5: Minimum score threshold (more lenient)
    // Only filter if score is very negative (opposite preferences)
    if (score < -0.2) { // Changed from settings.minScore to -0.2
      continue;
    }

    // Generate match reasons
    const reasons = generateMatchReasons(currentTaste, otherTaste, currentProfile, otherProfile, sharedMovies, sharedMusic, sharedShows);
    
    // Calculate compatibility breakdown
    const breakdown = calculateCompatibilityBreakdown(baseScore, sharedMovies, sharedMusic, sharedShows, personalityBoost, culturalBoost);

    if (score > -0.1) {
      const existingIndex = results.findIndex(r => String(r.userId).trim() === String(other.userId).trim());
      if (existingIndex !== -1) {
        if (score > results[existingIndex].score) {
          results[existingIndex] = {
            userId: other.userId,
            name: otherUser?.name || 'Unknown',
            email: otherUser?.email || '',
            age: otherAge,
            gender: otherUser?.gender,
            score: Math.max(0, score),
            reasons,
            breakdown,
            sharedMovies,
            sharedMusic,
            sharedShows
          };
        }
      } else {
        results.push({
          userId: other.userId,
          name: otherUser?.name || 'Unknown',
          email: otherUser?.email || '',
          age: otherAge,
          gender: otherUser?.gender,
          score: Math.max(0, score),
          reasons,
          breakdown,
          sharedMovies,
          sharedMusic,
          sharedShows
        });
      }
    }
  }

  // Sort by score
  const sorted = results.sort((a, b) => b.score - a.score);

  // Remove duplicates
  const uniqueMap = new Map();
  for (const match of sorted) {
    if (!match || !match.userId) continue;
    const userIdKey = String(match.userId).trim();
    if (!uniqueMap.has(userIdKey)) {
      uniqueMap.set(userIdKey, match);
    }
  }

  const finalResults = Array.from(uniqueMap.values());

  // Cache results (1 hour)
  if (!db.data.matchCache) {
    db.data.matchCache = [];
  }
  const existingCache = db.data.matchCache.findIndex(c => c.userId === userId && c.key === cacheKey);
  if (existingCache !== -1) {
    db.data.matchCache[existingCache] = {
      userId,
      key: cacheKey,
      matches: finalResults,
      expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour
    };
  } else {
    db.data.matchCache.push({
      userId,
      key: cacheKey,
      matches: finalResults,
      expiresAt: Date.now() + (60 * 60 * 1000)
    });
  }
  await db.write();

  // Apply daily limits and return
  return await applyFilters(finalResults, userId, settings, db);
};

// Helper function to apply filters (daily limits, etc.)
async function applyFilters(matches, userId, settings, db) {
  // Get today's date string
  const today = new Date().toISOString().split('T')[0];
  
  // Get today's match views
  if (!db.data.dailyMatchViews) {
    db.data.dailyMatchViews = [];
  }
  
  const todayViews = db.data.dailyMatchViews.find(v => v.userId === userId && v.date === today);
  const viewsToday = todayViews ? todayViews.count : 0;
  
  // Apply daily limit
  const remaining = Math.max(0, settings.maxDailyMatches - viewsToday);
  const limitedMatches = matches.slice(0, remaining);
  
  return limitedMatches;
}

// Track daily match views
exports.trackMatchView = async (userId) => {
  const db = await getDb();
  const today = new Date().toISOString().split('T')[0];
  
  if (!db.data.dailyMatchViews) {
    db.data.dailyMatchViews = [];
  }
  
  const todayViews = db.data.dailyMatchViews.find(v => v.userId === userId && v.date === today);
  if (todayViews) {
    todayViews.count++;
  } else {
    db.data.dailyMatchViews.push({
      userId,
      date: today,
      count: 1
    });
  }
  
  await db.write();
};

// Get match insights
exports.getMatchInsights = async (userId) => {
  const db = await getDb();
  
  const likedUsers = [];
  const passedUsers = [];
  
  if (db.data.matches) {
    db.data.matches.forEach(m => {
      if (m.fromUser === userId && m.status === "pending") {
        likedUsers.push(m.toUser);
      }
    });
  }
  
  if (db.data.passes) {
    db.data.passes.forEach(p => {
      if (p.fromUser === userId) {
        passedUsers.push(p.toUser);
      }
    });
  }
  
  // Get today's views
  const today = new Date().toISOString().split('T')[0];
  let viewsToday = 0;
  if (db.data.dailyMatchViews) {
    const todayViews = db.data.dailyMatchViews.find(v => v.userId === userId && v.date === today);
    viewsToday = todayViews ? todayViews.count : 0;
  }
  
  return {
    totalLiked: likedUsers.length,
    totalPassed: passedUsers.length,
    viewsToday,
    remainingToday: 50 - viewsToday // Default limit
  };
};

