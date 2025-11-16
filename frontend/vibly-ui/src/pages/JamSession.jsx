import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";

function JamSession() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const matchId = searchParams.get("matchId");
  const initialMessage = searchParams.get("message");
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState(initialMessage || "");
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      navigate("/login");
      return;
    }

    // Generate room ID from user IDs
    const currentRoomId = matchId 
      ? [userId, matchId].sort().join("-")
      : `jam-${userId}`;
    setRoomId(currentRoomId);

    // Connect to socket
    const newSocket = io("http://localhost:5001", {
      transports: ["websocket"]
    });

    newSocket.on("connect", () => {
      console.log("Connected to socket");
      newSocket.emit("joinRoom", currentRoomId);
    });

    newSocket.on("receiveMessage", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    setSocket(newSocket);

    // Load previous messages
    const loadMessages = async () => {
      try {
        const res = await axios.get(`http://localhost:5001/api/chat/${currentRoomId}`);
        setMessages(res.data.messages || []);
      } catch (err) {
        console.error("Error loading messages:", err);
      }
    };

    loadMessages();

    return () => {
      newSocket.disconnect();
    };
  }, [matchId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !socket || !roomId) return;

    const userId = localStorage.getItem("userId");
    const messageData = {
      roomId,
      senderId: userId,
      message: newMessage.trim()
    };

    // Send via socket
    socket.emit("sendMessage", messageData);

    // Also save to database
    try {
      await axios.post("http://localhost:5001/api/chat/send", messageData);
    } catch (err) {
      console.error("Error saving message:", err);
    }

    setNewMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white flex flex-col">
      <div className="p-4 border-b border-white/20 bg-white/5 backdrop-blur-sm flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
          <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          Jam Session
        </h1>
        <button
          onClick={() => navigate(-1)}
          className="text-white/80 hover:text-white flex items-center gap-2 transition-colors duration-200 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20 hover:bg-white/20"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-white/60 mt-8">
            <svg className="w-20 h-20 mx-auto mb-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <p className="text-lg text-white/80">No messages yet. Start the conversation!</p>
            {initialMessage && (
              <p className="mt-2 text-sm text-white/60">Suggested: "{initialMessage}"</p>
            )}
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isOwn = msg.senderId === localStorage.getItem("userId");
            return (
              <div
                key={idx}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl backdrop-blur-sm ${
                    isOwn
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
                      : "bg-white/10 text-white border border-white/20"
                  }`}
                >
                  <p className="text-white">{msg.message}</p>
                  <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-white/50'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-white/20 bg-white/5 backdrop-blur-sm">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-white/10 backdrop-blur-sm text-white placeholder-white/40 px-4 py-3 rounded-xl border border-white/20 focus:border-purple-400 focus:bg-white/15 focus:ring-2 focus:ring-purple-400/30 focus:outline-none transition-all duration-300"
          />
          <button
            onClick={sendMessage}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 px-6 py-3 rounded-xl text-white font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default JamSession;
