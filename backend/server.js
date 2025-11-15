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
const jamRooms = new Map(); // code -> Set of socket IDs

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Register user socket
  socket.on("registerUser", (userId) => {
    userSockets.set(userId, socket.id);
    socket.userId = userId;
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  socket.on("sendMessage", (data) => {
    io.to(data.room).emit("receiveMessage", data);
  });

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
  });

  // Jam Session Events
  socket.on("joinJamRoom", (data) => {
    const { code, isHost } = data;
    const roomId = `jam-${code}`;
    
    socket.join(roomId);
    
    // Track participants in this jam room
    if (!jamRooms.has(code)) {
      jamRooms.set(code, new Set());
    }
    jamRooms.get(code).add(socket.id);
    
    const participantCount = jamRooms.get(code).size;
    
    console.log(
      `User ${socket.id} joined jam room ${code} (${isHost ? "host" : "guest"})`
    );
    console.log(`Room ${code} now has ${participantCount} participants`);
    
    // Notify all participants in the room about the updated count
    io.to(roomId).emit("participantsUpdate", { count: participantCount });
  });

  socket.on("trackChange", (data) => {
    const { code, track, isPlaying } = data;
    const roomId = `jam-${code}`;
    
    // Broadcast track change to all participants except sender
    socket.to(roomId).emit("trackChange", { track, isPlaying });
    console.log(`Track changed in room ${code}: ${track?.name || "Unknown"}`);
  });

  socket.on("playbackControl", (data) => {
    const { code, isPlaying } = data;
    const roomId = `jam-${code}`;
    
    // Broadcast playback state to all participants except sender
    socket.to(roomId).emit("playbackState", { isPlaying });
    console.log(`Playback ${isPlaying ? "started" : "paused"} in room ${code}`);
  });

  socket.on("disconnect", () => {
    if (socket.userId) {
      userSockets.delete(socket.userId);
      console.log(`User ${socket.userId} disconnected`);
    } else {
      console.log("User disconnected:", socket.id);
    }
    
    // Remove user from all jam rooms
    jamRooms.forEach((participants, code) => {
      if (participants.has(socket.id)) {
        participants.delete(socket.id);
        const roomId = `jam-${code}`;
        const participantCount = participants.size;
        
        // Notify remaining participants
        io.to(roomId).emit("participantsUpdate", { count: participantCount });
        
        // Clean up empty rooms
        if (participantCount === 0) {
          jamRooms.delete(code);
          console.log(`Jam room ${code} closed (no participants)`);
        } else {
          console.log(`User left jam room ${code}, ${participantCount} remaining`);
        }
      }
    });
  });
});

// Export function to emit notifications
io.emitToUser = (userId, event, data) => {
  const socketId = userSockets.get(userId);
  if (socketId) {
    io.to(socketId).emit(event, data);
  }
};

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = io;
