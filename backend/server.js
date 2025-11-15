const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const app = require("./app");

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Don't exit the process, just log the error
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  // Don't exit the process, just log the error
});

const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "*",
  }
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

server.listen(5000, () => {
  console.log("Server running on port 5000");
  console.log("API endpoints available at http://localhost:5000/api");
  console.log("Health check: http://localhost:5000/health");
});

module.exports = io;
