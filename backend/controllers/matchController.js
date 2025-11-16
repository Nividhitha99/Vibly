const getDb = require("../utils/db");
const matchingService = require("../services/matchingService");
const cosineSimilarity = require("../utils/cosine");

// Helper function to calculate compatibility score for a specific user pair
async function calculateMatchScore(userId, otherUserId) {
  try {
    const db = await getDb();
    const allEmbeddings = db.data.embeddings || [];
    const allTastes = db.data.tastes || [];
    
    const currentEmbedding = allEmbeddings.find(e => e.userId === userId);
    const otherEmbedding = allEmbeddings.find(e => e.userId === otherUserId);
    
    // If no embeddings, return 0
    if (!currentEmbedding || !currentEmbedding.vector || !Array.isArray(currentEmbedding.vector) ||
        !otherEmbedding || !otherEmbedding.vector || !Array.isArray(otherEmbedding.vector)) {
      return 0;
    }
    
    // Calculate base score using cosine similarity
    let score = cosineSimilarity(currentEmbedding.vector, otherEmbedding.vector);
    
    // Get psychological profiles for personality boosts
    const currentProfile = currentEmbedding.psychologicalProfile || {};
    const otherProfile = otherEmbedding.psychologicalProfile || {};
    
    // Personality trait overlap boost
    if (currentProfile.dominantTraits && otherProfile.dominantTraits && 
        currentProfile.dominantTraits.length > 0 && otherProfile.dominantTraits.length > 0) {
      const currentTraits = new Set(currentProfile.dominantTraits.map(t => t.toLowerCase()));
      const otherTraits = new Set(otherProfile.dominantTraits.map(t => t.toLowerCase()));
      const traitOverlap = [...currentTraits].filter(t => otherTraits.has(t)).length;
      const totalUniqueTraits = new Set([...currentTraits, ...otherTraits]).size;
      const traitSimilarity = totalUniqueTraits > 0 ? traitOverlap / totalUniqueTraits : 0;
      
      if (traitSimilarity > 0.3) {
        score += traitSimilarity * 0.15; // Up to 15% boost
      }
    }
    
    // Get taste data for shared content boost
    const currentTaste = allTastes.find(t => t.userId === userId);
    const otherTaste = allTastes.find(t => t.userId === otherUserId);
    
    if (currentTaste && otherTaste) {
      // Count shared movies
      const currentMovies = new Set((currentTaste.movies || []).map(m => 
        typeof m === 'object' ? (m.title || m.name || '').toLowerCase() : String(m).toLowerCase()
      ));
      const otherMovies = new Set((otherTaste.movies || []).map(m => 
        typeof m === 'object' ? (m.title || m.name || '').toLowerCase() : String(m).toLowerCase()
      ));
      const sharedMovies = [...currentMovies].filter(m => otherMovies.has(m)).length;
      
      // Count shared music
      const currentMusic = new Set((currentTaste.music || []).map(m => 
        typeof m === 'object' ? (m.name || m.title || '').toLowerCase() : String(m).toLowerCase()
      ));
      const otherMusic = new Set((otherTaste.music || []).map(m => 
        typeof m === 'object' ? (m.name || m.title || '').toLowerCase() : String(m).toLowerCase()
      ));
      const sharedMusic = [...currentMusic].filter(m => otherMusic.has(m)).length;
      
      // Count shared shows
      const currentShows = new Set((currentTaste.shows || []).map(s => 
        typeof s === 'object' ? (s.title || s.name || '').toLowerCase() : String(s).toLowerCase()
      ));
      const otherShows = new Set((otherTaste.shows || []).map(s => 
        typeof s === 'object' ? (s.title || s.name || '').toLowerCase() : String(s).toLowerCase()
      ));
      const sharedShows = [...currentShows].filter(s => otherShows.has(s)).length;
      
      // Apply boosts for shared content
      if (sharedMovies >= 2) score += 0.08;
      if (sharedMusic >= 2) score += 0.07;
      if (sharedShows >= 2) score += 0.04;
    }
    
    // Ensure score is between 0 and 1
    return Math.max(0, Math.min(1, score));
  } catch (err) {
    console.error(`Error calculating match score for ${userId} and ${otherUserId}:`, err);
    return 0;
  }
}

// Get confirmed matches for a user
exports.getConfirmedMatches = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const db = await getDb();
    
    if (!db.data.matches) {
      return res.json({ matches: [] });
    }

    // Get all confirmed matches for this user
    const confirmedMatches = [];
    const matchedUserIds = new Set();

    db.data.matches.forEach(match => {
      if (match.status === "confirmed") {
        if (match.fromUser === userId && !matchedUserIds.has(match.toUser)) {
          matchedUserIds.add(match.toUser);
          const matchedUser = db.data.users.find(u => u.id === match.toUser);
          if (matchedUser) {
            confirmedMatches.push({
              userId: matchedUser.id,
              name: matchedUser.name,
              email: matchedUser.email,
              profileImages: matchedUser.profileImages || null,
              imageUrl: matchedUser.imageUrl || null,
              score: null // Will be calculated below
            });
          }
        } else if (match.toUser === userId && !matchedUserIds.has(match.fromUser)) {
          matchedUserIds.add(match.fromUser);
          const matchedUser = db.data.users.find(u => u.id === match.fromUser);
          if (matchedUser) {
            confirmedMatches.push({
              userId: matchedUser.id,
              name: matchedUser.name,
              email: matchedUser.email,
              profileImages: matchedUser.profileImages || null,
              imageUrl: matchedUser.imageUrl || null,
              score: null // Will be calculated below
            });
          }
        }
      }
    });

    // Calculate scores for all confirmed matches
    for (let match of confirmedMatches) {
      if (match.score === null) {
        match.score = await calculateMatchScore(userId, match.userId);
      }
    }

    res.json({ matches: confirmedMatches });
  } catch (err) {
    console.error("Error fetching confirmed matches:", err);
    res.status(500).json({ error: "Failed to fetch confirmed matches" });
  }
};

