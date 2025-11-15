const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const app = require("./app");

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
});

module.exports = io;
