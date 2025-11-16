const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const app = require("./app");

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

const server = http.createServer(app);

const io = socketio(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

// Store user socket mappings
const userSockets = new Map();
// Store jam room participants
const jamRooms = new Map(); // roomId -> Set of socket IDs

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Register user socket
  socket.on("registerUser", (userId) => {
    userSockets.set(userId, socket.id);
    socket.userId = userId;
    console.log(`✅ User ${userId} registered with socket ${socket.id}`);
    console.log(`📊 Total registered users: ${userSockets.size}`, Array.from(userSockets.keys()));
  });

  socket.on("sendMessage", async (data) => {
    const roomId = data.room || data.roomId;
    if (roomId) {
      console.log(`Broadcasting message to room ${roomId}:`, data.message);
      // Broadcast to all users in the room (including sender for confirmation)
      io.to(roomId).emit("receiveMessage", data);
      console.log(`Message broadcasted to room ${roomId}`);
    } else {
      console.warn("sendMessage received without roomId:", data);
    if (!roomId) {
      console.error("[BACKEND] No room ID provided in sendMessage");
      return;
    }
    
    if (!data.senderId || !data.message) {
      console.error("[BACKEND] Missing senderId or message in sendMessage");
      return;
    }
    
    // Verify socket is in the room
    const socketsInRoom = await io.in(roomId).fetchSockets();
    const isInRoom = socketsInRoom.some(s => s.id === socket.id);
    
    if (!isInRoom) {
      console.warn(`[BACKEND] Socket ${socket.id} tried to send message to room ${roomId} but is not in that room`);
      // Still allow it, but log a warning
    }
    
    console.log(`[BACKEND] Broadcasting message to room ${roomId} from ${data.senderId} (${socketsInRoom.length} sockets in room)`);
    
    // Broadcast to all sockets in the room (including sender for consistency)
    io.to(roomId).emit("receiveMessage", {
      ...data,
      room: roomId,
      roomId: roomId,
      timestamp: data.timestamp || Date.now() // Ensure timestamp exists
    });
  });

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room: ${roomId}`);
  });

  // Handle content selection for watch party
  socket.on("contentSelected", (data) => {
    const roomId = data.roomId;
    if (roomId) {
      // Broadcast to all users in the room (except sender)
      socket.to(roomId).emit("contentSelected", data);
      console.log(`Content selected in room ${roomId}:`, data.content?.title || data.content?.name);
    }
  });

  // Jam Session Events
  socket.on("joinJamRoom", async (data) => {
    const { roomId, userId, matchId } = data;
    
    if (!roomId) {
      console.error("No roomId provided for jam room");
      return;
    }
    
    // Remove socket from any previous jam rooms it might have been in
    jamRooms.forEach((participants, existingRoomId) => {
      if (participants.has(socket.id)) {
        participants.delete(socket.id);
        if (participants.size === 0) {
          jamRooms.delete(existingRoomId);
        } else {
          // Notify remaining participants in the old room
          io.to(existingRoomId).emit("participantsUpdate", { count: participants.size });
        }
      }
    });
    
    socket.join(roomId);
    
    // Track participants in this jam room
    if (!jamRooms.has(roomId)) {
      jamRooms.set(roomId, new Set());
    }
    // Check if socket is already in the room (shouldn't happen, but just in case)
    if (!jamRooms.get(roomId).has(socket.id)) {
      jamRooms.get(roomId).add(socket.id);
    }
    
    const participantCount = jamRooms.get(roomId).size;
    
    console.log(
      `[BACKEND] User ${socket.id} (${userId}) joined jam room ${roomId}`
    );
    console.log(`[BACKEND] Room ${roomId} now has ${participantCount} participants`);
    console.log(`[BACKEND] Socket IDs in room:`, Array.from(jamRooms.get(roomId)));
    
    // Get all sockets in the room to verify
    const socketsInRoom = await io.in(roomId).fetchSockets();
    console.log(`[BACKEND] Verified sockets in room ${roomId}:`, socketsInRoom.length);
    
    // Notify all participants in the room about the updated count
    // Use a small delay to ensure socket.join() has completed
    setTimeout(() => {
      const finalCount = jamRooms.has(roomId) ? jamRooms.get(roomId).size : 0;
      console.log(`[BACKEND] Emitting participantsUpdate to room ${roomId} with count ${finalCount}`);
      io.to(roomId).emit("participantsUpdate", { count: finalCount });
      // Also send directly to the joining socket to ensure they get the update
      socket.emit("participantsUpdate", { count: finalCount });
    }, 100);
  });

  // Request current participant count
  socket.on("getParticipantCount", (data) => {
    const { roomId } = data;
    if (!roomId) {
      return;
    }
    
    const participantCount = jamRooms.has(roomId) ? jamRooms.get(roomId).size : 0;
    console.log(`[BACKEND] getParticipantCount requested for room ${roomId}, returning: ${participantCount}`);
    // Only send to the requesting socket, not broadcast to entire room
    // This prevents race conditions and flickering
    socket.emit("participantsUpdate", { count: participantCount });
  });

  socket.on("trackChange", (data) => {
    const { roomId, track, isPlaying } = data;
    
    if (!roomId) {
      console.error("No roomId provided for trackChange");
      return;
    }
    
    // Broadcast track change to all participants except sender
    socket.to(roomId).emit("trackChange", { track, isPlaying });
    console.log(`Track changed in room ${roomId}: ${track?.name || "Unknown"}`);
  });

  socket.on("playbackControl", (data) => {
    const { roomId, isPlaying } = data;
    
    if (!roomId) {
      console.error("No roomId provided for playbackControl");
      return;
    }
    
    // Broadcast playback state to all participants except sender
    socket.to(roomId).emit("playbackState", { isPlaying });
    console.log(`Playback ${isPlaying ? "started" : "paused"} in room ${roomId}`);
  });

  socket.on("disconnect", () => {
    if (socket.userId) {
      userSockets.delete(socket.userId);
      console.log(`User ${socket.userId} disconnected`);
    } else {
      console.log("User disconnected:", socket.id);
    }
    
    // Remove user from all jam rooms
    jamRooms.forEach((participants, roomId) => {
      if (participants.has(socket.id)) {
        participants.delete(socket.id);
        const participantCount = participants.size;
        
        // Notify remaining participants
        io.to(roomId).emit("participantsUpdate", { count: participantCount });
        
        // Clean up empty rooms
        if (participantCount === 0) {
          jamRooms.delete(roomId);
          console.log(`Jam room ${roomId} closed (no participants)`);
        } else {
          console.log(`User left jam room ${roomId}, ${participantCount} remaining`);
        }
      }
    });
  });
});

// Export function to emit notifications
io.emitToUser = (userId, event, data) => {
  const socketId = userSockets.get(userId);
  if (socketId) {
    console.log(`📤 Emitting ${event} to user ${userId} (socket ${socketId})`);
    console.log(`📋 Event data:`, JSON.stringify(data, null, 2));
    io.to(socketId).emit(event, data);
    console.log(`✅ Event ${event} emitted successfully to ${userId}`);
  } else {
    console.warn(`⚠️ User ${userId} not registered with socket.`);
    console.log(`📊 Available registered users:`, Array.from(userSockets.keys()));
    console.log(`💾 Notification saved in DB - user will see it when they check notifications`);
    // If user is not registered, the notification will still be saved in DB
    // and will be shown when they check notifications
  }
};

const PORT = process.env.PORT || 5001;

// Set io instance in jam controller before server starts
const jamController = require("./controllers/jamController");
jamController.setIO(io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = io;
