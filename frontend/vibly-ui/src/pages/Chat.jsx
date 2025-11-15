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
      <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">
        <div className="text-xl">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex">
      {/* Conversations Sidebar */}
      <div className="w-80 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-2xl font-bold">💬 Messages</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              <p>No conversations yet.</p>
              <p className="text-sm mt-2">Start chatting with your matches!</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.userId}
                onClick={() => setSelectedConversation(conv)}
                className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-800 transition ${
                  selectedConversation?.userId === conv.userId ? "bg-gray-800" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold">
                    {conv.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{conv.name}</div>
                    {conv.lastMessage && (
                      <div className="text-sm text-gray-400 truncate">
                        {conv.lastMessage}
                      </div>
                    )}
                  </div>
                  {conv.lastMessageTime && (
                    <div className="text-xs text-gray-500">
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
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold">
                  {selectedConversation.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedConversation.name}</h2>
                  <p className="text-sm text-gray-400">{selectedConversation.email}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 mt-8">
                  <p className="text-lg">No messages yet. Start the conversation!</p>
                  {initialMessage && (
                    <p className="mt-2 text-sm">Suggested: "{initialMessage}"</p>
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
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isOwn
                            ? "bg-blue-600 text-white"
                            : "bg-gray-700 text-gray-100"
                        }`}
                      >
                        <p>{msg.message}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendMessage}
                  className="bg-blue-600 px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-xl">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;
