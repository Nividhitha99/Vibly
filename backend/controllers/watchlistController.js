const db = require("../utils/db");
const { autoTagItem } = require("../services/autoTagService");

exports.addToWatchlist = async (req, res) => {
  try {
    const { userId, type, title } = req.body;

    if (!userId || !type || !title) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const tags = await autoTagItem(title); 
    // AI predicts genre, mood, language, etc.

    const newItem = {
      id: Date.now().toString(),
      userId,
      type,        // "movie" | "music" | "show"
      title,
      tags
    };

    db.data.watchlist.push(newItem);
    await db.write();

    res.json({
      success: true,
      item: newItem
    });

  } catch (err) {
    console.log("Watchlist error:", err);
    res.status(500).json({ error: "Failed to add to watchlist" });
  }
};

exports.getWatchlist = async (req, res) => {
  try {
    const { userId } = req.params;

    const list = db.data.watchlist.filter(i => i.userId === userId);

    res.json({
      success: true,
      items: list
    });

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch watchlist" });
  }
};
