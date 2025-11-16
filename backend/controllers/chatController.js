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

exports.getConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    const db = await getDb();
    
    if (!db.data.messages) {
      db.data.messages = [];
    }

    // Get all room IDs that contain this user's ID
    const userRooms = new Set();
    db.data.messages.forEach(msg => {
      if (msg.roomId && msg.roomId.includes(userId)) {
        userRooms.add(msg.roomId);
      }
    });

    // Get confirmed matches to show potential chat partners
    // Use Set to automatically deduplicate
    const confirmedMatchesSet = new Set();
    if (db.data.matches) {
      db.data.matches.forEach(match => {
        if (match.status === "confirmed") {
          if (match.fromUser === userId) {
            confirmedMatchesSet.add(match.toUser);
          } else if (match.toUser === userId) {
            confirmedMatchesSet.add(match.fromUser);
          }
        }
      });
    }
    const confirmedMatches = Array.from(confirmedMatchesSet);

    // Get conversation data for each room
    const conversations = [];
    const processedUsers = new Set(); // Use Set to track processed user IDs

    // Process existing conversations
    for (const roomId of userRooms) {
      const roomMessages = db.data.messages
        .filter(m => m.roomId === roomId)
        .sort((a, b) => b.timestamp - a.timestamp);
      
      if (roomMessages.length === 0) continue;

      const lastMessage = roomMessages[0];
      
      // Extract other user ID from room ID
      // Room ID format: "userId1-userId2-chat" (sorted)
      const roomParts = roomId.replace("-chat", "").split("-");
      const otherUserId = roomParts.find(id => id !== userId && id.trim() !== "");

      // Only process if we haven't seen this user ID before
      if (otherUserId && !processedUsers.has(otherUserId)) {
        const otherUser = db.data.users.find(u => u.id === otherUserId);
        if (otherUser) {
          processedUsers.add(otherUserId); // Mark as processed
          conversations.push({
            userId: otherUserId,
            name: otherUser.name,
            email: otherUser.email,
            lastMessage: lastMessage.message,
            lastMessageTime: lastMessage.timestamp,
            unreadCount: 0 // Could be enhanced later
          });
        }
      }
    }

    // Add confirmed matches that don't have conversations yet
    // Use Set to ensure no duplicates
    const uniqueConfirmedMatches = [...new Set(confirmedMatches)];
    uniqueConfirmedMatches.forEach(matchUserId => {
      // Only add if not already in conversations
      if (!processedUsers.has(matchUserId)) {
        const matchUser = db.data.users.find(u => u.id === matchUserId);
        if (matchUser) {
          processedUsers.add(matchUserId); // Mark as processed
          conversations.push({
            userId: matchUserId,
            name: matchUser.name,
            email: matchUser.email,
            lastMessage: null,
            lastMessageTime: null,
            unreadCount: 0
          });
        }
      }
    });

    // Remove any remaining duplicates by userId (safety check)
    const uniqueConversations = [];
    const seenUserIds = new Set();
    
    conversations.forEach(conv => {
      if (!seenUserIds.has(conv.userId)) {
        seenUserIds.add(conv.userId);
        uniqueConversations.push(conv);
      }
    });

    // Sort by last message time (most recent first)
    uniqueConversations.sort((a, b) => {
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      return b.lastMessageTime - a.lastMessageTime;
    });

    res.json({
      success: true,
      conversations: uniqueConversations
    });

  } catch (err) {
    console.error("Error fetching conversations:", err);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
};
