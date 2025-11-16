const getDb = require("../utils/db");
const getUser = require("../services/userService").getUser;
const createNotification = require("./notificationController").createNotification;

// We'll get io from a global or pass it differently
let ioInstance = null;

// Function to set io instance (called from server.js)
exports.setIO = (io) => {
  ioInstance = io;
};

const getIOInstance = () => {
  return ioInstance;
};

exports.sendInvite = async (req, res) => {
  try {
    const { fromUserId, toUserId, roomId } = req.body;

    if (!fromUserId || !toUserId || !roomId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get sender's name
    const fromUser = await getUser(fromUserId);
    if (!fromUser) {
      return res.status(404).json({ error: "Sender not found" });
    }

    // Create notification for the invite
    const notification = await createNotification(
      toUserId,
      "jam-invite",
      `${fromUser.name} invited you to a jam session!`,
      fromUserId,
      { roomId } // Store roomId in notification data
    );

    // Emit real-time notification via Socket.IO
    const io = getIOInstance();
    if (io && io.emitToUser) {
      io.emitToUser(toUserId, "notification", notification);
    }

    res.json({ success: true, notification });
  } catch (err) {
    console.error("Send invite error:", err);
    res.status(500).json({ error: "Failed to send invite" });
  }
};

exports.acceptInvite = async (req, res) => {
  try {
    const { notificationId } = req.body;
    const userId = req.body.userId || req.params.userId;

    if (!notificationId || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const db = await getDb();
    
    if (!db.data.notifications) {
      return res.status(404).json({ error: "Notification not found" });
    }

    const notification = db.data.notifications.find(n => n.id === notificationId);
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    if (notification.type !== "jam-invite") {
      return res.status(400).json({ error: "Not a jam session invite" });
    }

    // Mark notification as read
    notification.read = true;
    
    // Extract roomId from notification data
    const roomId = notification.data?.roomId || notification.roomId;
    
    await db.write();

    res.json({ success: true, roomId });
  } catch (err) {
    console.error("Accept invite error:", err);
    res.status(500).json({ error: "Failed to accept invite" });
  }
};

