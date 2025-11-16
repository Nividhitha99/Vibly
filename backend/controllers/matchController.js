const getDb = require("../utils/db");

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
              score: match.score || null // If score is stored in match
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
              score: match.score || null
            });
          }
        }
      }
    });

    res.json({ matches: confirmedMatches });
  } catch (err) {
    console.error("Error fetching confirmed matches:", err);
    res.status(500).json({ error: "Failed to fetch confirmed matches" });
  }
};

