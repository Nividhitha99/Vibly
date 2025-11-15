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
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("sendMessage", (data) => {
    io.to(data.room).emit("receiveMessage", data);
  });

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Listen on all interfaces
server.listen(5001, () => {
  console.log("Server running on port 5001");
  console.log("API endpoints: http://localhost:5001/api");
  console.log("Health check:  http://localhost:5001/health");
});

module.exports = io;
