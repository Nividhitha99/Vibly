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
  
  // AI Features
  const [showAIHelper, setShowAIHelper] = useState(false);
  const [conversationStarters, setConversationStarters] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [flirtySuggestions, setFlirtySuggestions] = useState([]);
  const [conflictResolution, setConflictResolution] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const userId = localStorage.getItem("userId");

  // Fetch conversation starters for new chats - MOVED BEFORE useEffect
  const fetchConversationStarters = React.useCallback(async () => {
    if (!selectedConversation || !userId) return;
    
    setLoadingAI(true);
    try {
      const res = await axios.post("http://localhost:5001/api/ai-chat/conversation-starters", {
        userId,
        matchUserId: selectedConversation.userId
      });
      const starters = res.data.starters || [];
      console.log("[Chat] Fetched conversation starters:", starters);
      setConversationStarters(starters);
      // Auto-open AI helper if we have starters
      if (starters.length > 0) {
        setShowAIHelper(true);
      }
    } catch (err) {
      console.error("Error fetching conversation starters:", err);
      setConversationStarters([]);
    } finally {
      setLoadingAI(false);
    }
  }, [selectedConversation, userId]);

  // Analyze chat and get AI suggestions - MOVED BEFORE useEffect
  const analyzeChat = React.useCallback(async (msgs) => {
    if (!selectedConversation || !userId || !msgs || msgs.length === 0) return;
    
    setLoadingAI(true);
    try {
      const res = await axios.post("http://localhost:5001/api/ai-chat/analyze", {
        messages: msgs,
        userId,
        matchUserId: selectedConversation.userId
      });
      setAiSuggestions(res.data.analysis);
    } catch (err) {
      console.error("Error analyzing chat:", err);
    } finally {
      setLoadingAI(false);
    }
  }, [selectedConversation, userId]);

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
        const loadedMessages = res.data.messages || [];
        setMessages(loadedMessages);
        
        // If no messages, fetch conversation starters
        if (loadedMessages.length === 0) {
          fetchConversationStarters();
        } else {
          // Analyze chat for suggestions
          analyzeChat(loadedMessages);
        }
        
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
  }, [selectedConversation, userId, initialMessage, fetchConversationStarters, analyzeChat]);

  // Get flirty suggestions
  const getFlirtySuggestions = async () => {
    if (!newMessage.trim()) return;
    
    setLoadingAI(true);
    try {
      const res = await axios.post("http://localhost:5001/api/ai-chat/flirty-suggestions", {
        message: newMessage,
        context: `Conversation with ${selectedConversation?.name}`
      });
      setFlirtySuggestions(res.data.suggestions?.suggestions || []);
      setShowAIHelper(true);
    } catch (err) {
      console.error("Error getting flirty suggestions:", err);
    } finally {
      setLoadingAI(false);
    }
  };

  // Get conflict resolution
  const getConflictResolution = async () => {
    if (!selectedConversation || !userId || messages.length === 0) return;
    
    setLoadingAI(true);
    setConflictResolution(null); // Clear previous resolution
    try {
      const res = await axios.post("http://localhost:5001/api/ai-chat/conflict-resolution", {
        messages,
        userId,
        matchUserId: selectedConversation.userId
      });
      const resolution = res.data.resolution || res.data;
      console.log("[Chat] Conflict resolution result:", resolution);
      setConflictResolution(resolution);
      // Always show AI helper when conflict resolution is requested
      setShowAIHelper(true);
    } catch (err) {
      console.error("Error getting conflict resolution:", err);
      setConflictResolution({ hasConflict: false, message: "Error analyzing conflict. Please try again." });
      setShowAIHelper(true);
    } finally {
      setLoadingAI(false);
    }
  };

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
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <button
                    onClick={getConflictResolution}
                    className="p-2 rounded-lg bg-red-500/80 hover:bg-red-500 text-white transition-all duration-300 shadow-lg hover:shadow-xl"
                    title="Resolve Conflicts"
                  >
                    <span className="text-xl">⚔️</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* AI Helper Panel - Moved above messages */}
              {showAIHelper && (
                <div className="bg-gradient-to-r from-purple-500/60 to-indigo-500/60 backdrop-blur-xl rounded-xl p-4 border-2 border-purple-300/80 mb-4 shadow-2xl shadow-purple-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                      <svg className="w-6 h-6 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      AI Helper
                    </h3>
                    <button
                      onClick={() => setShowAIHelper(false)}
                      className="text-white hover:text-yellow-300 text-xl font-bold transition-colors"
                    >
                      ×
                    </button>
                  </div>
                  
                  {/* Conversation Starters */}
                  {conversationStarters.length > 0 && messages.length === 0 && (
                    <div className="mb-4">
                      <p className="text-white/80 text-sm mb-2">💡 Conversation Starters:</p>
                      <div className="space-y-2">
                        {conversationStarters.map((starter, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setNewMessage(starter);
                              setShowAIHelper(false);
                            }}
                            className="w-full text-left p-3 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-all duration-300 border border-white/20 hover:border-purple-400/50"
                          >
                            "{starter}"
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Analysis */}
                  {aiSuggestions && messages.length > 0 && (
                    <div className="mb-4">
                      <p className="text-white/80 text-sm mb-2">📊 Conversation Analysis:</p>
                      <div className="space-y-2 text-sm">
                        <p className="text-white/70">Tone: <span className="text-purple-300">{aiSuggestions.tone || "friendly"}</span></p>
                        {aiSuggestions.responseSuggestions && aiSuggestions.responseSuggestions.length > 0 && (
                          <div>
                            <p className="text-white/80 mb-1">Response Suggestions:</p>
                            {aiSuggestions.responseSuggestions.map((suggestion, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setNewMessage(suggestion);
                                  setShowAIHelper(false);
                                }}
                                className="w-full text-left p-2 bg-white/10 hover:bg-white/20 rounded text-white text-xs mb-1 transition-all duration-300"
                              >
                                "{suggestion}"
                              </button>
                            ))}
                          </div>
                        )}
                        {aiSuggestions.advice && (
                          <p className="text-white/70 italic">💡 {aiSuggestions.advice}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Flirty Suggestions */}
                  {flirtySuggestions.length > 0 && (
                    <div className="mb-4">
                      <p className="text-white/80 text-sm mb-2">💕 Flirty Variations:</p>
                      <div className="space-y-2">
                        {flirtySuggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setNewMessage(suggestion);
                              setFlirtySuggestions([]);
                              setShowAIHelper(false);
                            }}
                            className="w-full text-left p-3 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-all duration-300 border border-white/20 hover:border-pink-400/50"
                          >
                            "{suggestion}"
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Conflict Resolution */}
                  {conflictResolution && (
                    <div className={`${conflictResolution.hasConflict ? 'bg-gradient-to-r from-red-500/70 to-orange-500/70 border-2 border-red-300/90' : 'bg-gradient-to-r from-green-500/70 to-emerald-500/70 border-2 border-green-300/90'} rounded-lg p-4 shadow-2xl ${conflictResolution.hasConflict ? 'shadow-red-500/40' : 'shadow-green-500/40'}`}>
                      {conflictResolution.hasConflict ? (
                        <>
                          <p className="text-white text-base font-bold mb-2 flex items-center gap-2">
                            <span className="text-2xl">⚔️</span>
                            <span>Potential Conflict Detected</span>
                          </p>
                          <p className="text-white text-sm mb-3 font-medium">{conflictResolution.issue || conflictResolution.message || "A potential conflict was detected in your conversation."}</p>
                          {conflictResolution.suggestedResponse && (
                            <button
                              onClick={() => {
                                setNewMessage(conflictResolution.suggestedResponse);
                                setShowAIHelper(false);
                              }}
                              className="w-full text-left p-3 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm mb-2 transition-all duration-300 border border-white/30 hover:border-white/50 font-semibold"
                            >
                              💬 Suggested: "{conflictResolution.suggestedResponse}"
                            </button>
                          )}
                          {conflictResolution.advice && (
                            <p className="text-white/90 text-sm italic">{conflictResolution.advice}</p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-white text-base font-bold mb-2 flex items-center gap-2">
                            <span className="text-2xl">✅</span>
                            <span>No Conflicts Detected</span>
                          </p>
                          <p className="text-white text-sm mb-3 font-medium">{conflictResolution.message || "Your conversation looks healthy!"}</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {messages.length === 0 ? (
                <div className="text-center text-white/60 mt-8">
                  <svg className="w-20 h-20 mx-auto mb-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-lg text-white/80">No messages yet. Start the conversation!</p>
                  {loadingAI ? (
                    <p className="mt-2 text-sm text-white/60">✨ AI is generating conversation starters...</p>
                  ) : conversationStarters.length > 0 ? (
                    <button
                      onClick={() => setShowAIHelper(true)}
                      className="mt-4 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-white text-sm transition-all duration-300 border border-purple-400/30"
                    >
                      💡 Show AI Conversation Starters
                    </button>
                  ) : (
                    <button
                      onClick={fetchConversationStarters}
                      className="mt-4 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-white text-sm transition-all duration-300 border border-purple-400/30"
                    >
                      ✨ Get AI Conversation Starters
                    </button>
                  )}
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

            <div className="p-4 border-t border-white/20 bg-white/5 backdrop-blur-sm relative">
              {/* Floating AI Helper Button */}
              <button
                onClick={() => setShowAIHelper(!showAIHelper)}
                className="absolute -top-12 right-4 w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 rounded-full text-white shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 flex items-center justify-center z-10 animate-float"
                title="AI Helper"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </button>
              
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
              
              {/* Add floating animation style */}
              <style>{`
                @keyframes float {
                  0%, 100% {
                    transform: translateY(0px);
                  }
                  50% {
                    transform: translateY(-10px);
                  }
                }
                .animate-float {
                  animation: float 3s ease-in-out infinite;
                }
              `}</style>
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
