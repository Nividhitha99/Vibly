import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";

function Chat() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const matchId = searchParams.get("matchId");
  const initialMessage = searchParams.get("message");
  
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState(initialMessage || "");
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const userId = localStorage.getItem("userId");

  // Load conversations list
  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    const loadConversations = async () => {
      try {
        const res = await axios.get(`http://localhost:5001/api/chat/conversations/${userId}`);
        setConversations(res.data.conversations || []);
        
        // If matchId is provided, select that conversation
        if (matchId) {
          const conversation = res.data.conversations.find(c => c.userId === matchId);
          if (conversation) {
            setSelectedConversation(conversation);
          }
        } else if (res.data.conversations.length > 0) {
          // Otherwise, select the first conversation
          setSelectedConversation(res.data.conversations[0]);
        }
      } catch (err) {
        console.error("Error loading conversations:", err);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [userId, navigate, matchId]);

  // Set up socket and load messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation || !userId) return;

    // Generate room ID from user IDs
    const currentRoomId = [userId, selectedConversation.userId].sort().join("-chat");
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
      // Update conversation list with new last message
      setConversations(prev => 
        prev.map(conv => 
          conv.userId === selectedConversation.userId
            ? { ...conv, lastMessage: data.message, lastMessageTime: data.timestamp }
            : conv
        )
      );
    });

    setSocket(newSocket);

    // Load previous messages
    const loadMessages = async () => {
      try {
        const res = await axios.get(`http://localhost:5001/api/chat/${currentRoomId}`);
        setMessages(res.data.messages || []);
        if (initialMessage) {
          setNewMessage(initialMessage);
        }
      } catch (err) {
        console.error("Error loading messages:", err);
      }
    };

    loadMessages();

    return () => {
      newSocket.disconnect();
    };
  }, [selectedConversation, userId, initialMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !socket || !roomId || !selectedConversation) return;

    const messageData = {
      roomId,
      senderId: userId,
      message: newMessage.trim()
    };

    // Send via socket
    socket.emit("sendMessage", {
      ...messageData,
      room: roomId
    });

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

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-white mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-white text-xl">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex">
      {/* Conversations Sidebar */}
      <div className="w-80 bg-white/5 backdrop-blur-xl border-r border-white/20 flex flex-col">
        <div className="p-4 border-b border-white/20 bg-white/5">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
            <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Messages
          </h1>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-white/60">
              <svg className="w-16 h-16 mx-auto mb-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-white/80">No conversations yet.</p>
              <p className="text-sm mt-2 text-white/60">Start chatting with your matches!</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.userId}
                onClick={() => setSelectedConversation(conv)}
                className={`p-4 border-b border-white/10 cursor-pointer transition-all duration-300 ${
                  selectedConversation?.userId === conv.userId 
                    ? "bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-l-4 border-purple-400" 
                    : "hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                    {conv.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate text-white">{conv.name}</div>
                    {conv.lastMessage && (
                      <div className="text-sm text-white/60 truncate">
                        {conv.lastMessage}
                      </div>
                    )}
                  </div>
                  {conv.lastMessageTime && (
                    <div className="text-xs text-white/50">
                      {formatTime(conv.lastMessageTime)}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white/5 backdrop-blur-sm">
        {selectedConversation ? (
          <>
            <div className="p-4 border-b border-white/20 bg-white/5 backdrop-blur-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-lg font-bold text-white shadow-lg">
                  {selectedConversation.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedConversation.name}</h2>
                  <p className="text-sm text-white/60">{selectedConversation.email}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-white/60 mt-8">
                  <svg className="w-20 h-20 mx-auto mb-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-lg text-white/80">No messages yet. Start the conversation!</p>
                  {initialMessage && (
                    <p className="mt-2 text-sm text-white/60">Suggested: "{initialMessage}"</p>
                  )}
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isOwn = msg.senderId === userId;
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
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-white/60">
              <svg className="w-24 h-24 mx-auto mb-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-xl text-white/80">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;
