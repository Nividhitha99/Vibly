const getDb = require("../utils/db");
const getUser = require("../services/userService").getUser;

exports.createNotification = async (userId, type, message, relatedUserId = null) => {
  const db = await getDb();
  
  if (!db.data.notifications) {
    db.data.notifications = [];
  }

  const notification = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    userId,
    type, // "like", "match", etc.
    message,
    relatedUserId,
    read: false,
    createdAt: Date.now()
  };

  db.data.notifications.push(notification);
  await db.write();

  return notification;
};

exports.getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    const db = await getDb();
    
    if (!db.data.notifications) {
      db.data.notifications = [];
    }

    const notifications = db.data.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);

    res.json({
      success: true,
      notifications
    });
  } catch (err) {
    console.error("Get notifications error:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const db = await getDb();
    
    if (!db.data.notifications) {
      db.data.notifications = [];
    }

    const notification = db.data.notifications.find(n => n.id === notificationId);
    
    if (notification) {
      notification.read = true;
      await db.write();
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Mark as read error:", err);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;

    const db = await getDb();
    
    if (!db.data.notifications) {
      db.data.notifications = [];
    }

    db.data.notifications
      .filter(n => n.userId === userId && !n.read)
      .forEach(n => n.read = true);
    
    await db.write();

    res.json({ success: true });
  } catch (err) {
    console.error("Mark all as read error:", err);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;

    const db = await getDb();
    
    if (!db.data.notifications) {
      db.data.notifications = [];
    }

    const count = db.data.notifications.filter(
      n => n.userId === userId && !n.read
    ).length;

    res.json({
      success: true,
      count
    });
  } catch (err) {
    console.error("Get unread count error:", err);
    res.status(500).json({ error: "Failed to get unread count" });
  }
};

