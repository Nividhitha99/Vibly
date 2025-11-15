const getDb = require("../utils/db");
const cosineSimilarity = require("../utils/cosine");

exports.getMatches = async (userId) => {
  const db = await getDb();
  const allUsers = db.data.users;
  const allTastes = db.data.tastes;
  const allEmbeddings = db.data.embeddings;

  console.log(`[Matching] Finding matches for user ${userId}`);
  console.log(`[Matching] Total users: ${allUsers.length}, Total tastes: ${allTastes.length}, Total embeddings: ${allEmbeddings.length}`);

  const currentEmbedding = allEmbeddings.find(e => e.userId === userId);
  if (!currentEmbedding || !currentEmbedding.vector || !Array.isArray(currentEmbedding.vector)) {
    console.log(`[Matching] No embedding found for user ${userId} or embedding vector is missing`);
    console.log(`[Matching] Available embeddings:`, allEmbeddings.map(e => ({ userId: e.userId, hasVector: !!e.vector })));
    return [];
  }

  const currentTaste = allTastes.find(t => t.userId === userId);
  if (!currentTaste) {
    console.log(`[Matching] No taste data found for user ${userId}`);
    return [];
  }

  console.log(`[Matching] Current user has embedding and taste data. Finding matches...`);

  const results = [];

  console.log(`[Matching] Checking ${allEmbeddings.length} embeddings for matches...`);
  
  // Remove duplicate embeddings early - keep only the first occurrence of each userId
  const seenEmbeddingUserIds = new Set();
  const uniqueEmbeddings = [];
  for (const emb of allEmbeddings) {
    if (!emb.userId) continue;
    const normalizedId = String(emb.userId).trim();
    if (!seenEmbeddingUserIds.has(normalizedId)) {
      seenEmbeddingUserIds.add(normalizedId);
      uniqueEmbeddings.push(emb);
    } else {
      console.log(`[Matching] Skipping duplicate embedding for userId: ${normalizedId}`);
    }
  }
  
  if (uniqueEmbeddings.length !== allEmbeddings.length) {
    console.log(`[Matching] Removed ${allEmbeddings.length - uniqueEmbeddings.length} duplicate embeddings`);
  }

  for (let other of uniqueEmbeddings) {
    if (other.userId === userId) {
      console.log(`[Matching] Skipping self: ${other.userId}`);
      continue;
    }
    
    // Skip if other embedding doesn't have a vector
    if (!other.vector || !Array.isArray(other.vector)) {
      console.log(`[Matching] Skipping ${other.userId} - no valid vector`);
      continue;
    }

    const otherTaste = allTastes.find(t => t.userId === other.userId);
    const otherUser = allUsers.find(u => u.id === other.userId);

    if (!otherTaste) {
      console.log(`[Matching] Skipping ${other.userId} - no taste data`);
      continue;
    }
    
    if (!otherUser) {
      console.log(`[Matching] Skipping ${other.userId} - no user data`);
      continue;
    }
    
    console.log(`[Matching] Processing match with ${otherUser.name} (${other.userId})`);

    // -----------------------------------
    // REGION FILTER
    // -----------------------------------
    if (currentTaste.regionPreference === "same" && currentTaste.region) {
      if (otherTaste.region !== currentTaste.region) {
        console.log(`[Matching] Skipping ${otherUser.name} - region mismatch (${currentTaste.region} vs ${otherTaste.region})`);
        continue; // skip this match entirely
      }
    }

    // -----------------------------------
    // AI-POWERED PERSONALITY-BASED SCORING
    // -----------------------------------
    // Get psychological profiles for both users
    const currentProfile = currentEmbedding.psychologicalProfile || {};
    const otherProfile = other.psychologicalProfile || {};

    // Start with cosine similarity as base score
    let score = cosineSimilarity(currentEmbedding.vector, other.vector);
    
    // AI-Powered Personality Compatibility Scoring
    if (currentProfile.dominantTraits && otherProfile.dominantTraits && 
        currentProfile.dominantTraits.length > 0 && otherProfile.dominantTraits.length > 0) {
      
      // Calculate trait overlap
      const currentTraits = new Set(currentProfile.dominantTraits.map(t => t.toLowerCase()));
      const otherTraits = new Set(otherProfile.dominantTraits.map(t => t.toLowerCase()));
      const traitOverlap = [...currentTraits].filter(t => otherTraits.has(t)).length;
      const totalUniqueTraits = new Set([...currentTraits, ...otherTraits]).size;
      const traitSimilarity = totalUniqueTraits > 0 ? traitOverlap / totalUniqueTraits : 0;
      
      // Boost score based on trait similarity
      if (traitSimilarity > 0.3) {
        score += traitSimilarity * 0.15; // Up to 15% boost for similar traits
        console.log(`[Matching] Personality trait overlap: ${traitOverlap}/${totalUniqueTraits} (${(traitSimilarity * 100).toFixed(1)}%)`);
      }

      // Check emotional profile compatibility
      if (currentProfile.emotionalProfile && otherProfile.emotionalProfile) {
        const energyMatch = currentProfile.emotionalProfile.energyLevel === otherProfile.emotionalProfile.energyLevel;
        const intensityMatch = currentProfile.emotionalProfile.emotionalIntensity === otherProfile.emotionalProfile.emotionalIntensity;
        const socialMatch = currentProfile.emotionalProfile.socialOrientation === otherProfile.emotionalProfile.socialOrientation;
        
        if (energyMatch) score += 0.05;
        if (intensityMatch) score += 0.05;
        if (socialMatch) score += 0.03;
        
        console.log(`[Matching] Emotional profile match - Energy: ${energyMatch}, Intensity: ${intensityMatch}, Social: ${socialMatch}`);
      }

      // Check compatibility factors
      if (currentProfile.compatibilityFactors && otherProfile.compatibilityFactors) {
        const currentIdeal = new Set((currentProfile.compatibilityFactors.idealMatchTraits || []).map(t => t.toLowerCase()));
        const otherTraits = new Set(otherProfile.dominantTraits.map(t => t.toLowerCase()));
        const compatibilityMatch = [...currentIdeal].filter(t => otherTraits.has(t)).length;
        
        if (compatibilityMatch > 0) {
          score += (compatibilityMatch / Math.max(currentIdeal.size, 1)) * 0.1; // Up to 10% boost
          console.log(`[Matching] Compatibility factor match: ${compatibilityMatch} traits`);
        }
      }
    }

    // -----------------------------------
    // CULTURAL MATCHING
    // -----------------------------------
    if (currentProfile.culturalProfile && otherProfile.culturalProfile) {
      const currentCultures = new Set((currentProfile.culturalProfile.preferredCultures || []).map(c => c.toLowerCase()));
      const otherCultures = new Set((otherProfile.culturalProfile.preferredCultures || []).map(c => c.toLowerCase()));
      
      if (currentCultures.size > 0 && otherCultures.size > 0) {
        const culturalOverlap = [...currentCultures].filter(c => otherCultures.has(c)).length;
        const totalUniqueCultures = new Set([...currentCultures, ...otherCultures]).size;
        const culturalSimilarity = totalUniqueCultures > 0 ? culturalOverlap / totalUniqueCultures : 0;
        
        if (culturalSimilarity > 0) {
          score += culturalSimilarity * 0.12; // Up to 12% boost for cultural match
          console.log(`[Matching] Cultural overlap: ${culturalOverlap}/${totalUniqueCultures} (${(culturalSimilarity * 100).toFixed(1)}%)`);
        }
        
        // Check cultural compatibility from compatibility factors
        if (currentProfile.compatibilityFactors?.culturalCompatibility) {
          const currentCulturalCompat = new Set((currentProfile.compatibilityFactors.culturalCompatibility || []).map(c => c.toLowerCase()));
          const culturalCompatMatch = [...currentCulturalCompat].filter(c => otherCultures.has(c)).length;
          
          if (culturalCompatMatch > 0) {
            score += (culturalCompatMatch / Math.max(currentCulturalCompat.size, 1)) * 0.08; // Up to 8% boost
            console.log(`[Matching] Cultural compatibility match: ${culturalCompatMatch} cultures`);
          }
        }
      }
    }

    // -----------------------------------
    // THEMATIC MATCHING
    // -----------------------------------
    if (currentProfile.thematicProfile && otherProfile.thematicProfile) {
      const currentThemes = new Set((currentProfile.thematicProfile.preferredThemes || []).map(t => t.toLowerCase()));
      const otherThemes = new Set((otherProfile.thematicProfile.preferredThemes || []).map(t => t.toLowerCase()));
      
      if (currentThemes.size > 0 && otherThemes.size > 0) {
        const thematicOverlap = [...currentThemes].filter(t => otherThemes.has(t)).length;
        const totalUniqueThemes = new Set([...currentThemes, ...otherThemes]).size;
        const thematicSimilarity = totalUniqueThemes > 0 ? thematicOverlap / totalUniqueThemes : 0;
        
        if (thematicSimilarity > 0) {
          score += thematicSimilarity * 0.10; // Up to 10% boost for thematic match
          console.log(`[Matching] Thematic overlap: ${thematicOverlap}/${totalUniqueThemes} (${(thematicSimilarity * 100).toFixed(1)}%)`);
        }
        
        // Check thematic compatibility from compatibility factors
        if (currentProfile.compatibilityFactors?.thematicCompatibility) {
          const currentThematicCompat = new Set((currentProfile.compatibilityFactors.thematicCompatibility || []).map(t => t.toLowerCase()));
          const thematicCompatMatch = [...currentThematicCompat].filter(t => otherThemes.has(t)).length;
          
          if (thematicCompatMatch > 0) {
            score += (thematicCompatMatch / Math.max(currentThematicCompat.size, 1)) * 0.06; // Up to 6% boost
            console.log(`[Matching] Thematic compatibility match: ${thematicCompatMatch} themes`);
          }
        }
      }
    }

    // -----------------------------------
    // REGIONAL MATCHING
    // -----------------------------------
    if (currentProfile.regionalProfile && otherProfile.regionalProfile) {
      const currentRegions = new Set((currentProfile.regionalProfile.preferredRegions || []).map(r => r.toLowerCase()));
      const otherRegions = new Set((otherProfile.regionalProfile.preferredRegions || []).map(r => r.toLowerCase()));
      
      if (currentRegions.size > 0 && otherRegions.size > 0) {
        const regionalOverlap = [...currentRegions].filter(r => otherRegions.has(r)).length;
        const totalUniqueRegions = new Set([...currentRegions, ...otherRegions]).size;
        const regionalSimilarity = totalUniqueRegions > 0 ? regionalOverlap / totalUniqueRegions : 0;
        
        if (regionalSimilarity > 0) {
          score += regionalSimilarity * 0.10; // Up to 10% boost for regional match
          console.log(`[Matching] Regional overlap: ${regionalOverlap}/${totalUniqueRegions} (${(regionalSimilarity * 100).toFixed(1)}%)`);
        }
        
        // Check regional compatibility from compatibility factors
        if (currentProfile.compatibilityFactors?.regionalCompatibility) {
          const currentRegionalCompat = new Set((currentProfile.compatibilityFactors.regionalCompatibility || []).map(r => r.toLowerCase()));
          const regionalCompatMatch = [...currentRegionalCompat].filter(r => otherRegions.has(r)).length;
          
          if (regionalCompatMatch > 0) {
            score += (regionalCompatMatch / Math.max(currentRegionalCompat.size, 1)) * 0.06; // Up to 6% boost
            console.log(`[Matching] Regional compatibility match: ${regionalCompatMatch} regions`);
          }
        }
      }
    }

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

    // AI-Powered Similar Movie Detection (by genre, theme, style)
    let similarMovies = 0;
    if (currentMovies.length > 0 && otherMovies.length > 0) {
      // Check for similar genres, themes, and styles
      const currentGenres = new Set();
      const otherGenres = new Set();
      
      currentMovies.forEach(m => {
        if (typeof m === 'object' && m.genres) {
          m.genres.forEach(g => currentGenres.add(g.toLowerCase()));
        }
      });
      
      otherMovies.forEach(m => {
        if (typeof m === 'object' && m.genres) {
          m.genres.forEach(g => otherGenres.add(g.toLowerCase()));
        }
      });
      
      const genreOverlap = [...currentGenres].filter(g => otherGenres.has(g)).length;
      similarMovies = genreOverlap; // Similar movies based on genre overlap
    }

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

    // Movie overlap boost (exact matches)
    if (sharedMovies >= 2) {
      score += 0.08; // Increased boost for exact matches
      console.log(`[Matching] Shared movies: ${sharedMovies}`);
    }
    // Similar movies boost (genre/theme/style similarity)
    if (similarMovies >= 3) {
      score += 0.06; // Boost for similar taste
      console.log(`[Matching] Similar movies (genre overlap): ${similarMovies}`);
    }
    // Movie genre overlap boost
    if (movieGenreOverlap >= 2) {
      score += 0.04; // Slightly increased
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
    // ADD TO RESULTS (only if score is positive or above threshold)
    // -----------------------------------
    // Only add matches with positive scores (or very close to 0)
    // Negative cosine similarity means opposite preferences
    if (score > -0.1) { // Allow slightly negative scores but filter out very negative ones
      console.log(`[Matching] Adding match: ${otherUser.name} with score ${score.toFixed(4)}`);
      results.push({
        userId: other.userId,
        name: otherUser?.name,
        email: otherUser?.email,
        score: Math.max(0, score) // Ensure score is at least 0 for display
      });
    } else {
      console.log(`[Matching] Skipping ${otherUser.name} - score too low: ${score.toFixed(4)}`);
    }
  }

  // Sort highest score first
  const sorted = results.sort((a, b) => b.score - a.score);
  
  // Remove duplicates by userId (in case same user appears multiple times)
  // Use Map to keep the highest scoring version of each user
  const uniqueMap = new Map();
  const seenUserIds = new Set();
  
  for (const match of sorted) {
    // Skip if no userId
    if (!match || !match.userId) {
      console.log(`[Matching] Skipping match without userId:`, match);
      continue;
    }
    
    // Normalize userId (trim whitespace, convert to string)
    const normalizedUserId = String(match.userId).trim();
    
    // If we've seen this userId, keep the one with higher score
    if (seenUserIds.has(normalizedUserId)) {
      const existing = uniqueMap.get(normalizedUserId);
      if (existing && match.score > existing.score) {
        console.log(`[Matching] Replacing duplicate ${normalizedUserId} with higher score: ${match.score.toFixed(4)} > ${existing.score.toFixed(4)}`);
        uniqueMap.set(normalizedUserId, match);
      } else {
        console.log(`[Matching] Skipping duplicate ${normalizedUserId} (${match.name || 'Unknown'}) - lower or equal score`);
      }
    } else {
      seenUserIds.add(normalizedUserId);
      uniqueMap.set(normalizedUserId, match);
    }
  }
  
  const uniqueResults = Array.from(uniqueMap.values());
  
  // Final safety check - filter by userId one more time
  const finalResults = [];
  const finalSeen = new Set();
  for (const match of uniqueResults) {
    const id = String(match.userId).trim();
    if (!finalSeen.has(id)) {
      finalSeen.add(id);
      finalResults.push(match);
    } else {
      console.log(`[Matching] Final filter: Removing duplicate ${id} (${match.name || 'Unknown'})`);
    }
  }
  
  console.log(`[Matching] Found ${sorted.length} matches, ${uniqueResults.length} after Map dedup, ${finalResults.length} final unique for user ${userId}`);
  if (finalResults.length > 0) {
    console.log(`[Matching] Top match: ${finalResults[0].name} with score ${finalResults[0].score.toFixed(3)}`);
    console.log(`[Matching] All match IDs:`, finalResults.map(m => `${m.name} (${m.userId})`));
  }
  
  return finalResults;
};
