import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";

function WatchParty() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const matchId = searchParams.get("matchId");
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      navigate("/login");
      return;
    }

    // Generate room ID from user IDs
    const currentRoomId = matchId 
      ? [userId, matchId].sort().join("-watch")
      : `watch-${userId}`;
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
          <svg className="w-6 h-6 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Watch Party
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

      <div className="flex-1 flex">
        {/* Video/Content Area */}
        <div className="flex-1 p-4">
          {selectedContent ? (
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-20"></div>
              <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 text-center">
                <h2 className="text-2xl font-semibold mb-4 text-white">{selectedContent.title || selectedContent.name}</h2>
                <p className="text-white/60 mb-4">Content player would go here</p>
                <p className="text-sm text-white/50">In a full implementation, this would show the selected movie/show</p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-20"></div>
              <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 text-center">
                <svg className="w-24 h-24 mx-auto mb-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-white/80 mb-4 text-lg">No content selected</p>
                <button
                  onClick={() => navigate("/preferences")}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 px-6 py-3 rounded-xl text-white font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                >
                  Browse Content
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Chat Sidebar */}
        <div className="w-80 border-l border-white/20 bg-white/5 backdrop-blur-xl flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-white/60 mt-8">
                <svg className="w-16 h-16 mx-auto mb-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-sm text-white/80">No messages yet. Start chatting!</p>
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
                      className={`max-w-xs px-3 py-2 rounded-xl text-sm backdrop-blur-sm ${
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
          </div>

          <div className="p-4 border-t border-white/20 bg-white/5 backdrop-blur-sm">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 bg-white/10 backdrop-blur-sm text-white placeholder-white/40 px-3 py-2 rounded-xl text-sm border border-white/20 focus:border-purple-400 focus:bg-white/15 focus:ring-2 focus:ring-purple-400/30 focus:outline-none transition-all duration-300"
              />
              <button
                onClick={sendMessage}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 px-4 py-2 rounded-xl hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 text-sm font-semibold text-white flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WatchParty;
