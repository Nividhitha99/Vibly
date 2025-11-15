const getDb = require("../utils/db");
const { createNotification } = require("./notificationController");
const getUser = require("../services/userService").getUser;

// Get io instance lazily to avoid circular dependency
let ioInstance = null;
const getIO = () => {
  if (!ioInstance) {
    try {
      ioInstance = require("../server");
    } catch (err) {
      console.error("Could not get io instance:", err);
    }
  }
  return ioInstance;
};

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

    // Check if the other user already liked back (pending or confirmed)
    const existing = db.data.matches.find(
      m => (m.fromUser === toUser && m.toUser === fromUser) && (m.status === "pending" || m.status === "confirmed")
    );

    // Also check if we already have a confirmed match
    const alreadyConfirmed = db.data.matches.find(
      m => ((m.fromUser === fromUser && m.toUser === toUser) || (m.fromUser === toUser && m.toUser === fromUser)) && m.status === "confirmed"
    );

    if (alreadyConfirmed) {
      // Already matched, return confirmed
      console.log(`[MatchStatus] Users ${fromUser} and ${toUser} already have a confirmed match`);
      return res.json({ success: true, match: "confirmed" });
    }

    if (existing) {
      // Convert both to confirmed
      existing.status = "confirmed";

      // Check if we already have a record for this direction
      const reverseMatch = db.data.matches.find(
        m => m.fromUser === fromUser && m.toUser === toUser
      );

      if (!reverseMatch) {
        db.data.matches.push({
          fromUser,
          toUser,
          status: "confirmed"
        });
      } else {
        reverseMatch.status = "confirmed";
      }

      await db.write();
      console.log(`[MatchStatus] Match confirmed between ${fromUser} and ${toUser}`);
      return res.json({ success: true, match: "confirmed" });
    }

    // Otherwise create a pending like
    db.data.matches.push({
      fromUser,
      toUser,
      status: "pending"
    });
    await db.write();

    // Create notification for the person who was liked
    try {
      const fromUserData = await getUser(fromUser);
      if (fromUserData) {
        const notification = await createNotification(
          toUser,
          "like",
          `${fromUserData.name} wants to connect with you!`,
          fromUser
        );
        
        // Emit real-time notification via Socket.IO
        const io = getIO();
        if (io && io.emitToUser) {
          io.emitToUser(toUser, "notification", notification);
        }
      }
    } catch (err) {
      console.error("Error creating notification:", err);
      // Don't fail the like request if notification fails
    }

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
