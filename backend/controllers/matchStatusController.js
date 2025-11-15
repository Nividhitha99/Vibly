const getDb = require("../utils/db");

exports.sendLike = async (req, res) => {
  try {
    const { fromUser, toUser } = req.body;

    if (!fromUser || !toUser) {
      return res.status(400).json({ error: "Missing user IDs" });
    }

    const db = await getDb();
    
    // Initialize matches array if it doesn't exist
    if (!db.data.matches) {
      db.data.matches = [];
    }

    // Check if the other user already liked back
    const existing = db.data.matches.find(
      m => m.fromUser === toUser && m.toUser === fromUser && m.status === "pending"
    );

    if (existing) {
      // Convert both to confirmed
      existing.status = "confirmed";

      db.data.matches.push({
        fromUser,
        toUser,
        status: "confirmed"
      });

      await db.write();
      return res.json({ success: true, match: "confirmed" });
    }

    // Otherwise create a pending like
    db.data.matches.push({
      fromUser,
      toUser,
      status: "pending"
    });
    await db.write();

    res.json({ success: true, match: "pending" });

  } catch (err) {
    console.log("Match error:", err);
    res.status(500).json({ error: "Match failed" });
  }
};

exports.getMatchStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const db = await getDb();
    
    // Initialize matches array if it doesn't exist
    if (!db.data.matches) {
      db.data.matches = [];
    }

    const matches = db.data.matches.filter(
      m => m.fromUser === userId || m.toUser === userId
    );

    res.json({
      success: true,
      matches
    });

  } catch (err) {
    res.status(500).json({ error: "Could not fetch match status" });
  }
};
