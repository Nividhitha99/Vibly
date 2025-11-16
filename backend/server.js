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

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Register user socket
  socket.on("registerUser", (userId) => {
    userSockets.set(userId, socket.id);
    socket.userId = userId;
    console.log(`✅ User ${userId} registered with socket ${socket.id}`);
    console.log(`📊 Total registered users: ${userSockets.size}`, Array.from(userSockets.keys()));
  });

  socket.on("sendMessage", (data) => {
    const roomId = data.room || data.roomId;
    if (roomId) {
      console.log(`Broadcasting message to room ${roomId}:`, data.message);
      // Broadcast to all users in the room (including sender for confirmation)
      io.to(roomId).emit("receiveMessage", data);
      console.log(`Message broadcasted to room ${roomId}`);
    } else {
      console.warn("sendMessage received without roomId:", data);
    }
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

  socket.on("disconnect", () => {
    if (socket.userId) {
      userSockets.delete(socket.userId);
      console.log(`User ${socket.userId} disconnected`);
    } else {
      console.log("User disconnected");
    }
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

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = io;
