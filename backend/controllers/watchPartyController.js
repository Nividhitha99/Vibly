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

// Start watch party and send notification to the other user
exports.startWatchParty = async (req, res) => {
  try {
    const { userId, matchId } = req.body;

    if (!userId || !matchId) {
      return res.status(400).json({ error: "userId and matchId are required" });
    }

    // Get user info
    const user = await getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate watch party link
    const watchPartyUrl = `/watch-party?matchId=${userId}`;
    const fullUrl = `http://localhost:3000${watchPartyUrl}`;

    // Create notification for the matched user
    const notification = await createNotification(
      matchId,
      "watchParty",
      `${user.name} wants to start a watch party with you! Please join the link.`,
      userId,
      watchPartyUrl
    );

    // Emit real-time notification via Socket.IO
    const io = getIO();
    if (io && io.emitToUser) {
      console.log(`📤 Attempting to send watch party notification to ${matchId}`);
      console.log(`📋 Notification data:`, {
        id: notification.id,
        type: notification.type,
        message: notification.message,
        actionUrl: notification.actionUrl
      });
      io.emitToUser(matchId, "notification", notification);
      console.log(`✅ Notification emit called for ${matchId}`);
    } else {
      console.warn("⚠️ Socket.IO not available for real-time notification");
      console.log("💾 Notification saved in database - user will see it when they check notifications");
    }

    console.log(`Watch party started by ${user.name} (${userId}) for match ${matchId}`);

    res.json({
      success: true,
      message: "Watch party notification sent",
      watchPartyUrl,
      notification
    });

  } catch (err) {
    console.error("Start watch party error:", err);
    res.status(500).json({ error: "Failed to start watch party" });
  }
};

// Join watch party by code (optional - for future use)
exports.joinWatchPartyByCode = async (req, res) => {
  try {
    const { code, userId } = req.body;

    if (!code || !userId) {
      return res.status(400).json({ error: "code and userId are required" });
    }

    // For now, we'll use the matchId from the URL
    // In a full implementation, you'd decode the code to get the room/match info
    res.json({
      success: true,
      message: "Join by code functionality - use the link from notification instead"
    });

  } catch (err) {
    console.error("Join watch party error:", err);
    res.status(500).json({ error: "Failed to join watch party" });
  }
};

