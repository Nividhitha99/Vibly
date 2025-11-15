const getDb = require("../utils/db");

exports.saveMessage = async (req, res) => {
  try {
    const { roomId, senderId, message } = req.body;

    const db = await getDb();
    
    // Initialize messages array if it doesn't exist
    if (!db.data.messages) {
      db.data.messages = [];
    }

    const newMsg = {
      id: Date.now().toString(),
      roomId,
      senderId,
      message,
      timestamp: Date.now()
    };

    db.data.messages.push(newMsg);
    await db.write();

    res.json({ success: true, message: newMsg });

  } catch (err) {
    res.status(500).json({ error: "Message save failed" });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;

    const db = await getDb();
    
    // Initialize messages array if it doesn't exist
    if (!db.data.messages) {
      db.data.messages = [];
    }

    const msgs = db.data.messages.filter(m => m.roomId === roomId);

    res.json({
      success: true,
      messages: msgs
    });

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};
