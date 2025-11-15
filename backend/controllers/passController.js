const getDb = require("../utils/db");

exports.passUser = async (req, res) => {
  try {
    const { fromUser, toUser } = req.body;

    if (!fromUser || !toUser) {
      return res.status(400).json({ error: "Missing user IDs" });
    }

    const db = await getDb();
    
    if (!db.data.passes) {
      db.data.passes = [];
    }

    // Check if already passed
    const existing = db.data.passes.find(
      p => p.fromUser === fromUser && p.toUser === toUser
    );

    if (existing) {
      return res.json({ success: true, message: "Already passed" });
    }

    // Add pass
    db.data.passes.push({
      fromUser,
      toUser,
      passedAt: Date.now()
    });

    await db.write();

    res.json({ success: true, message: "User passed" });
  } catch (err) {
    console.error("Pass error:", err);
    res.status(500).json({ error: "Failed to pass user" });
  }
};

exports.getPassedUsers = async (req, res) => {
  try {
    const { userId } = req.params;

    const db = await getDb();
    
    if (!db.data.passes) {
      db.data.passes = [];
    }

    const passed = db.data.passes
      .filter(p => p.fromUser === userId)
      .map(p => p.toUser);

    res.json({ success: true, passedUsers: passed });
  } catch (err) {
    console.error("Get passed users error:", err);
    res.status(500).json({ error: "Failed to get passed users" });
  }
};

exports.undoPass = async (req, res) => {
  try {
    const { fromUser, toUser } = req.body;

    if (!fromUser || !toUser) {
      return res.status(400).json({ error: "Missing user IDs" });
    }

    const db = await getDb();
    
    if (!db.data.passes) {
      db.data.passes = [];
    }

    const index = db.data.passes.findIndex(
      p => p.fromUser === fromUser && p.toUser === toUser
    );

    if (index !== -1) {
      db.data.passes.splice(index, 1);
      await db.write();
    }

    res.json({ success: true, message: "Pass undone" });
  } catch (err) {
    console.error("Undo pass error:", err);
    res.status(500).json({ error: "Failed to undo pass" });
  }
};

