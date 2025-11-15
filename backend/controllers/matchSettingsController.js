const getDb = require("../utils/db");

exports.getMatchSettings = async (req, res) => {
  try {
    const { userId } = req.params;

    const db = await getDb();
    
    if (!db.data.userMatchSettings) {
      db.data.userMatchSettings = [];
    }

    let settings = db.data.userMatchSettings.find(s => s.userId === userId);
    
    // Return default settings if none exist
    if (!settings) {
      settings = {
        userId,
        minAge: 18,
        maxAge: 100,
        preferredGenders: [],
        minScore: 0,
        maxDailyMatches: 50,
        weights: {
          movies: 0.4,
          music: 0.4,
          shows: 0.2
        },
        dealBreakers: []
      };
    }

    res.json({ success: true, settings });
  } catch (err) {
    console.error("Get match settings error:", err);
    res.status(500).json({ error: "Failed to get match settings" });
  }
};

exports.updateMatchSettings = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    const db = await getDb();
    
    if (!db.data.userMatchSettings) {
      db.data.userMatchSettings = [];
    }

    let settings = db.data.userMatchSettings.find(s => s.userId === userId);
    
    if (settings) {
      Object.assign(settings, updates);
    } else {
      settings = {
        userId,
        minAge: updates.minAge || 18,
        maxAge: updates.maxAge || 100,
        preferredGenders: updates.preferredGenders || [],
        minScore: updates.minScore || 0,
        maxDailyMatches: updates.maxDailyMatches || 50,
        weights: updates.weights || { movies: 0.4, music: 0.4, shows: 0.2 },
        dealBreakers: updates.dealBreakers || []
      };
      db.data.userMatchSettings.push(settings);
    }

    await db.write();

    res.json({ success: true, settings });
  } catch (err) {
    console.error("Update match settings error:", err);
    res.status(500).json({ error: "Failed to update match settings" });
  }
};

