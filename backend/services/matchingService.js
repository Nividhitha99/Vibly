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

  // Get users that current user has already liked or passed
  const likedUserIds = new Set();
  const passedUserIds = new Set();
  const matchedUserIds = new Set();
  
  if (db.data.matches) {
    db.data.matches.forEach(m => {
      if (m.fromUser === userId) {
        if (m.status === "confirmed") {
          matchedUserIds.add(m.toUser);
        } else {
          likedUserIds.add(m.toUser); // pending likes
        }
      }
      // Also check if they liked us and we matched
      if (m.toUser === userId && m.status === "confirmed") {
        matchedUserIds.add(m.fromUser);
      }
    });
  }
  
  if (db.data.passes) {
    db.data.passes.forEach(p => {
      if (p.fromUser === userId) {
        passedUserIds.add(p.toUser);
      }
    });
  }
  
  console.log(`[Matching] Excluding ${likedUserIds.size} liked users, ${passedUserIds.size} passed users, ${matchedUserIds.size} matched users`);

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
    
    // Skip users that have already been liked, passed, or matched
    if (likedUserIds.has(other.userId)) {
      console.log(`[Matching] Skipping ${other.userId} - already liked`);
      continue;
    }
    if (passedUserIds.has(other.userId)) {
      console.log(`[Matching] Skipping ${other.userId} - already passed`);
      continue;
    }
    if (matchedUserIds.has(other.userId)) {
      console.log(`[Matching] Skipping ${other.userId} - already matched`);
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
    
    // CRITICAL: Verify userId consistency - embedding userId must match user id
    if (other.userId !== otherUser.id) {
      console.error(`[Matching] ERROR: userId mismatch! Embedding userId: ${other.userId}, User id: ${otherUser.id}, User name: ${otherUser.name}`);
      console.error(`[Matching] This will cause data mismatch - skipping this match`);
      continue; // Skip this match to prevent showing wrong user's data
    }
    
    console.log(`[Matching] Processing match with ${otherUser.name} (userId: ${other.userId}, user.id: ${otherUser.id}) - VERIFIED CONSISTENT`);

    // -----------------------------------
    // GENDER FILTER (More lenient - only filter if both users have strict preferences)
    // -----------------------------------
    const currentUser = allUsers.find(u => u.id === userId);
    if (currentUser && currentUser.lookingFor && otherUser.gender) {
      const lookingForArray = Array.isArray(currentUser.lookingFor) 
        ? currentUser.lookingFor 
        : [currentUser.lookingFor];
      
      // Only filter if preference is very specific (not "non-binary" alone, or if it's a clear mismatch)
      // Allow matches if lookingFor includes "non-binary" OR if it matches the other user's gender
      const otherGenderLower = otherUser.gender.toLowerCase();
      const isMatch = lookingForArray.some(pref => {
        const prefLower = pref.toLowerCase();
        // If looking for non-binary, allow all genders (more inclusive)
        if (prefLower === 'non-binary') return true;
        return prefLower === otherGenderLower;
      });
      
      if (!isMatch) {
        console.log(`[Matching] Skipping ${otherUser.name} - gender preference mismatch (looking for: ${lookingForArray.join(", ")}, found: ${otherUser.gender})`);
        continue;
      }
    }
    
    // Also check if other user is looking for current user's gender (more lenient)
    if (otherUser.lookingFor && currentUser && currentUser.gender) {
      const otherLookingForArray = Array.isArray(otherUser.lookingFor) 
        ? otherUser.lookingFor 
        : [otherUser.lookingFor];
      
      const currentGenderLower = currentUser.gender.toLowerCase();
      const isMatch = otherLookingForArray.some(pref => {
        const prefLower = pref.toLowerCase();
        // If looking for non-binary, allow all genders (more inclusive)
        if (prefLower === 'non-binary') return true;
        return prefLower === currentGenderLower;
      });
      
      if (!isMatch) {
        console.log(`[Matching] Skipping ${otherUser.name} - they're not looking for ${currentUser.gender}`);
        continue;
      }
    }

    // -----------------------------------
    // AGE FILTER
    // -----------------------------------
    if (currentUser && currentUser.ageRangeMin !== undefined && currentUser.ageRangeMax !== undefined) {
      const otherAge = otherUser.age;
      if (otherAge !== undefined && otherAge !== null) {
        // Only filter if age is provided and out of range
        if (otherAge < currentUser.ageRangeMin || otherAge > currentUser.ageRangeMax) {
          console.log(`[Matching] Skipping ${otherUser.name} - age out of range (${otherAge} not in ${currentUser.ageRangeMin}-${currentUser.ageRangeMax})`);
          continue; // skip this match entirely
        }
      }
      // If age is not provided, allow the match (don't skip) - user can decide
      // This ensures users without age info can still be matched
    }

    // -----------------------------------
    // DISTANCE FILTER (simple city/region matching for now)
    // -----------------------------------
    if (currentUser && currentUser.maxDistance !== undefined && currentUser.maxDistance > 0) {
      // For now, check if they're in the same city or region
      // In a real app, you'd calculate actual distance using coordinates
      const currentLocation = (currentUser.city || "").toLowerCase();
      const otherLocation = (otherUser.city || "").toLowerCase();
      const currentRegion = (currentUser.location || currentUser.region || "").toLowerCase();
      const otherRegion = (otherUser.location || otherUser.region || "").toLowerCase();
      
      // Only filter if both users have location information
      // If location info is missing, allow the match (user can decide)
      if (currentLocation && otherLocation) {
        // If maxDistance is small (10-20 miles), require same city
        // For 30+ miles, be more lenient - only filter if very far apart
        if (currentUser.maxDistance <= 20) {
          if (currentLocation !== otherLocation) {
            console.log(`[Matching] Skipping ${otherUser.name} - different city (${currentLocation} vs ${otherLocation})`);
            continue;
          }
        } else if (currentUser.maxDistance <= 30) {
          // For 30 miles, be very lenient - only filter if completely different countries
          // In a real app with actual coordinates, 30 miles would allow nearby cities
          // For now, only filter if they're in completely different countries AND different cities
          // Allow matches within the same country or nearby regions
          if (currentLocation !== otherLocation) {
            // Only filter if they're in completely different countries (e.g., US vs India)
            // But allow if they're in the same country or nearby countries
            // For 30 miles, this is too restrictive, so we'll be very lenient
            // Only skip if it's clearly a different continent AND different country
            const sameCountry = currentRegion && otherRegion && currentRegion.toLowerCase() === otherRegion.toLowerCase();
            if (!sameCountry) {
              // For 30 miles, allow matches from nearby countries/regions
              // Only filter if it's clearly very far (e.g., different continents)
              // But since we don't have exact coordinates, be lenient and allow most matches
              // Only filter if it's clearly impossible (e.g., US vs Asia when distance is 30 miles)
              // For now, allow all matches at 30 miles - user can decide
              console.log(`[Matching] Allowing ${otherUser.name} - different location but within 30 mile tolerance`);
            }
            // Allow the match - don't filter by location for 30 miles
          }
        }
      }
      // For 50+ miles, allow any location (no filter)
      // If location info is missing, allow the match
    }

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
      // At this point, we've already verified userId === otherUser.id above
      // Use otherUser.id to ensure consistency (in case of any edge cases)
      const matchUserId = otherUser.id; // Use user.id as the source of truth
      
      results.push({
        userId: matchUserId, // Use user.id to ensure consistency
        name: otherUser.name || 'Unknown',
        email: otherUser.email || '',
        profileImages: otherUser.profileImages || null,
        imageUrl: otherUser.imageUrl || null, // Keep for backward compatibility
        score: Math.max(0, score) // Ensure score is at least 0 for display
      });
      
      // Log to verify data consistency
      console.log(`[Matching] ✅ Added match: ${otherUser.name} (userId: ${matchUserId}, email: ${otherUser.email}) - ALL DATA VERIFIED`);
    } else {
      console.log(`[Matching] Skipping ${otherUser.name} - score too low: ${score.toFixed(4)}`);
    }
  }

  // Filter matches by 60% threshold (score >= 0.6)
  const filteredResults = results.filter(match => {
    const score = match.score || 0;
    return score >= 0.6;
  });
  
  console.log(`[Matching] Filtered ${results.length} matches to ${filteredResults.length} with 60%+ compatibility`);
  
  // Sort highest score first
  const sorted = filteredResults.sort((a, b) => {
    const scoreA = a.score || 0;
    const scoreB = b.score || 0;
    return scoreB - scoreA; // High to low
  });
  
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
        console.log(`[Matching] Replacing duplicate ${normalizedUserId} (${match.name}) with higher score: ${match.score.toFixed(4)} > ${existing.score.toFixed(4)}`);
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
  
  // Final safety check - filter by userId one more time (CRITICAL - ensure no duplicates)
  const finalResults = [];
  const finalSeen = new Set();
  for (const match of uniqueResults) {
    const id = String(match.userId).trim();
    if (!finalSeen.has(id)) {
      finalSeen.add(id);
      finalResults.push(match);
    } else {
      console.error(`[Matching] ❌ CRITICAL: Final filter removing duplicate ${id} (${match.name || 'Unknown'}) - this should not happen!`);
    }
  }
  
  // EXTRA VERIFICATION: Check for any remaining duplicates
  const finalUserIds = finalResults.map(m => String(m.userId).trim());
  const duplicateCheck = finalUserIds.filter((id, index) => finalUserIds.indexOf(id) !== index);
  if (duplicateCheck.length > 0) {
    console.error(`[Matching] ❌ CRITICAL ERROR: Found ${duplicateCheck.length} duplicate userIds in final results:`, duplicateCheck);
    // Remove duplicates - keep only the first occurrence
    const trulyUnique = [];
    const trulySeen = new Set();
    for (const match of finalResults) {
      const id = String(match.userId).trim();
      if (!trulySeen.has(id)) {
        trulySeen.add(id);
        trulyUnique.push(match);
      }
    }
    console.error(`[Matching] Removed ${finalResults.length - trulyUnique.length} additional duplicates`);
    return trulyUnique;
  }
  
  // Ensure final results are sorted high to low
  finalResults.sort((a, b) => {
    const scoreA = a.score || 0;
    const scoreB = b.score || 0;
    return scoreB - scoreA; // High to low
  });
  
  console.log(`[Matching] Found ${sorted.length} matches, ${uniqueResults.length} after Map dedup, ${finalResults.length} final unique for user ${userId}`);
  if (finalResults.length > 0) {
    console.log(`[Matching] Top match: ${finalResults[0].name} with score ${(finalResults[0].score * 100).toFixed(1)}%`);
    console.log(`[Matching] All match IDs:`, finalResults.map(m => `${m.name} (${(m.score * 100).toFixed(1)}%)`));
  }
  
  return finalResults;
};
