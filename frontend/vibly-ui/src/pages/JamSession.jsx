import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";

export default function JamSession() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null); // null, 'create', 'join'
  const [jamCode, setJamCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState(0);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [userName, setUserName] = useState("");
  const socketRef = useRef(null);
  const audioRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Check authentication on mount and get user name
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      navigate("/login");
      return;
    }
    
    // Fetch user name
    const fetchUserName = async () => {
      try {
        const res = await axios.get(`http://localhost:5001/api/user/${userId}`);
        setUserName(res.data.name || "User");
      } catch (err) {
        console.error("Error fetching user name:", err);
        setUserName("User");
      }
    };
    fetchUserName();
  }, [navigate]);

  // Generate a random 6-digit code
  const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Initialize socket connection and join room when mode/jamCode changes
  useEffect(() => {
    if (mode && jamCode) {
      if (!socketRef.current) {
        socketRef.current = io("http://localhost:5001", {
          transports: ["websocket"],
        });

        socketRef.current.on("connect", () => {
          console.log("Connected to server");
          setIsConnected(true);
          const roomId = `jam-${jamCode}`;
          socketRef.current.emit("joinRoom", roomId);
          socketRef.current.emit("joinJamRoom", { 
            code: jamCode, 
            isHost: mode === "create" 
          });
          
          // Load previous messages
          const loadMessages = async () => {
            try {
              const res = await axios.get(`http://localhost:5001/api/chat/${roomId}`);
              setMessages(res.data.messages || []);
            } catch (err) {
              console.error("Error loading messages:", err);
            }
          };
          loadMessages();
        });

        socketRef.current.on("disconnect", () => {
          console.log("Disconnected from server");
          setIsConnected(false);
        });

        // Listen for participant count updates
        socketRef.current.on("participantsUpdate", (data) => {
          setParticipants(data.count);
        });

        // Listen for track changes from other participants
        socketRef.current.on("trackChange", async (data) => {
          setCurrentTrack(data.track);
          setIsPlaying(data.isPlaying);
          if (data.track && audioRef.current && data.track.preview_url) {
            audioRef.current.src = data.track.preview_url;
            try {
              if (data.isPlaying) {
                await audioRef.current.play();
              } else {
                audioRef.current.pause();
              }
            } catch (err) {
              console.error("Error playing track from socket:", err);
              setIsPlaying(false);
            }
          }
        });

        // Listen for playback state changes
        socketRef.current.on("playbackState", async (data) => {
          setIsPlaying(data.isPlaying);
          if (audioRef.current) {
            try {
              if (data.isPlaying) {
                await audioRef.current.play();
              } else {
                audioRef.current.pause();
              }
            } catch (err) {
              console.error("Error controlling playback from socket:", err);
            }
          }
        });

        // Listen for chat messages
        socketRef.current.on("receiveMessage", (data) => {
          setMessages((prev) => [...prev, data]);
        });
      } else if (socketRef.current.connected) {
        // Socket already connected, just join the room
        const roomId = `jam-${jamCode}`;
        socketRef.current.emit("joinRoom", roomId);
        socketRef.current.emit("joinJamRoom", { 
          code: jamCode, 
          isHost: mode === "create" 
        });
        
        // Load previous messages
        const loadMessages = async () => {
          try {
            const res = await axios.get(`http://localhost:5001/api/chat/${roomId}`);
            setMessages(res.data.messages || []);
          } catch (err) {
            console.error("Error loading messages:", err);
          }
        };
        loadMessages();
      }
    }

    return () => {
      if (socketRef.current && !mode) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [mode, jamCode]);

  const handleCreateJam = () => {
    const code = generateCode();
    setJamCode(code);
    setMode("create");
  };

  const handleJoinJam = () => {
    if (!joinCode || joinCode.length !== 6) {
      alert("Please enter a valid 6-digit code");
      return;
    }
    
    setMode("join");
    setJamCode(joinCode);
  };

  const handlePlayPause = async () => {
    const newPlayingState = !isPlaying;
    setIsPlaying(newPlayingState);
    
    // Actually play/pause the audio
    if (audioRef.current && currentTrack?.preview_url) {
      try {
        if (newPlayingState) {
          await audioRef.current.play();
        } else {
          audioRef.current.pause();
        }
      } catch (err) {
        console.error("Error controlling playback:", err);
        setIsPlaying(!newPlayingState);
      }
    }
    
    if (socketRef.current && jamCode) {
      socketRef.current.emit("playbackControl", {
        code: jamCode,
        isPlaying: newPlayingState,
      });
    }
  };

  const handleTrackSelect = async (track) => {
    // Transform track to match expected format
    const trackData = {
      id: track.id,
      name: track.name,
      artists: track.artists || [],
      album: {
        id: track.album?.id,
        name: track.album?.name,
        images: track.album?.imageUrl ? [{ url: track.album.imageUrl }] : [],
      },
      preview_url: track.previewUrl || track.preview_url,
    };
    
    setCurrentTrack(trackData);
    setSearchQuery("");
    setSearchResults([]);
    setIsPlaying(true);
    
    // Set audio source and play
    if (audioRef.current && trackData.preview_url) {
      audioRef.current.src = trackData.preview_url;
      try {
        await audioRef.current.play();
      } catch (err) {
        console.error("Error playing audio:", err);
        setIsPlaying(false);
      }
    }
    
    if (socketRef.current && jamCode) {
      socketRef.current.emit("trackChange", {
        code: jamCode,
        track: trackData,
        isPlaying: true,
      });
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await axios.get(
        `http://localhost:5001/api/search/tracks?q=${encodeURIComponent(searchQuery)}`
      );
      setSearchResults(response.data.results || []);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(jamCode);
    alert("Code copied to clipboard!");
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !socketRef.current || !jamCode) return;
    
    const userId = localStorage.getItem("userId");
    const roomId = `jam-${jamCode}`;
    
    const messageData = {
      room: roomId,
      senderId: userId,
      senderName: userName,
      message: newMessage.trim(),
      timestamp: Date.now()
    };
    
    // Emit message via socket
    socketRef.current.emit("sendMessage", messageData);
    
    // Also save to backend
    try {
      await axios.post("http://localhost:5001/api/chat", {
        roomId: roomId,
        senderId: userId,
        message: newMessage.trim()
      });
    } catch (err) {
      console.error("Error saving message:", err);
    }
    
    setNewMessage("");
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initial view - Choose Create or Join
  if (!mode) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center p-6">
        <div className="bg-slate-800 p-10 rounded-xl w-full max-w-md shadow-lg">
          <h1 className="text-3xl font-bold text-center mb-8">Jam Session</h1>
          
          <div className="space-y-4">
            <button
              onClick={handleCreateJam}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg text-lg font-semibold transition-colors"
            >
              Create Jam
            </button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-800 text-gray-400">OR</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <input
                type="text"
                maxLength="6"
                placeholder="Enter 6-digit code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, ""))}
                className="w-full p-3 rounded bg-slate-700 text-white text-center text-2xl tracking-widest placeholder-gray-500"
              />
              <button
                onClick={handleJoinJam}
                className="w-full bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg text-lg font-semibold transition-colors"
              >
                Join Jam
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Jam Session Active View
  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-slate-800 p-6 rounded-xl mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Jam Session</h1>
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <span className="text-sm text-gray-400">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>
          
          {/* Code Display */}
          <div className="bg-slate-900 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Jam Code</p>
                <p className="text-3xl font-mono font-bold tracking-widest">
                  {jamCode}
                </p>
              </div>
              {mode === "create" && (
                <button
                  onClick={copyCodeToClipboard}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
                >
                  Copy Code
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {mode === "create"
                ? "Share this code with your match to join"
                : "You've joined the jam session"}
            </p>
          </div>
          
          {/* Participants Count */}
          <div className="mt-4 text-center">
            <p className="text-gray-400">
              <span className="font-semibold text-white">{participants}</span>{" "}
              {participants === 1 ? "person" : "people"} in session
            </p>
          </div>
        </div>

        {/* Main Content Grid - Music Player and Chat Side by Side */}
        {participants >= 2 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Music Player Section */}
            <div className="bg-slate-800 p-6 rounded-xl space-y-6">
              <h2 className="text-xl font-bold">Now Playing Together</h2>
            
            {/* Track Search */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search for a song..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1 p-3 rounded bg-slate-700 text-white placeholder-gray-400"
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded text-white font-semibold disabled:opacity-50"
                >
                  {isSearching ? "Searching..." : "Search"}
                </button>
              </div>
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="bg-slate-900 rounded-lg max-h-64 overflow-y-auto">
                  {searchResults.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => handleTrackSelect(track)}
                      className="w-full p-3 hover:bg-slate-800 text-left flex items-center gap-3 transition-colors"
                    >
                      {track.album?.imageUrl && (
                        <img
                          src={track.album.imageUrl}
                          alt={track.name}
                          className="w-12 h-12 rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">
                          {track.name}
                        </p>
                        <p className="text-sm text-gray-400 truncate">
                          {track.artists?.map((a) => a.name).join(", ")}
                        </p>
                      </div>
                      {track.previewUrl && (
                        <span className="text-xs text-green-400">▶ Preview</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Current Track Display */}
            {currentTrack ? (
              <div className="space-y-4">
                <div className="bg-slate-900 p-4 rounded-lg">
                  <div className="flex items-center gap-4">
                    {currentTrack.album?.images?.[0] && (
                      <img
                        src={currentTrack.album.images[0].url}
                        alt={currentTrack.name}
                        className="w-20 h-20 rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {currentTrack.name}
                      </h3>
                      <p className="text-gray-400">
                        {currentTrack.artists
                          ?.map((artist) => artist.name)
                          .join(", ")}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center gap-4">
                  <button
                    onClick={handlePlayPause}
                    className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg text-lg font-semibold"
                  >
                    {isPlaying ? "⏸ Pause" : "▶ Play"}
                  </button>
                </div>
                
                {currentTrack.preview_url && (
                  <audio
                    ref={audioRef}
                    src={currentTrack.preview_url}
                    onEnded={() => {
                      setIsPlaying(false);
                      if (socketRef.current && jamCode) {
                        socketRef.current.emit("playbackControl", {
                          code: jamCode,
                          isPlaying: false,
                        });
                      }
                    }}
                    onError={(e) => {
                      console.error("Audio error:", e);
                      setIsPlaying(false);
                    }}
                    className="hidden"
                  />
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>No track selected yet</p>
                <p className="text-sm mt-2">
                  Search and select a track above to start listening together
                </p>
              </div>
            )}
            </div>

            {/* Chat Section */}
            <div className="bg-slate-800 p-6 rounded-xl flex flex-col">
              <h2 className="text-xl font-bold mb-4">Chat</h2>
              
              {/* Messages Display */}
              <div className="bg-slate-900 rounded-lg p-4 flex-1 overflow-y-auto mb-4 min-h-[300px] max-h-[500px]">
                {messages.length === 0 ? (
                  <p className="text-gray-400 text-center">No messages yet. Start chatting!</p>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`mb-3 ${
                        msg.senderId === localStorage.getItem("userId")
                          ? "text-right"
                          : "text-left"
                      }`}
                    >
                      <div
                        className={`inline-block p-3 rounded-lg max-w-xs ${
                          msg.senderId === localStorage.getItem("userId")
                            ? "bg-blue-600 text-white"
                            : "bg-slate-700 text-white"
                        }`}
                      >
                        {msg.senderId !== localStorage.getItem("userId") && (
                          <p className="text-xs font-semibold mb-1 opacity-80">
                            {msg.senderName || "User"}
                          </p>
                        )}
                        <p className="text-sm break-words">{msg.message}</p>
                        <p className="text-xs opacity-60 mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Message Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  className="flex-1 p-3 rounded bg-slate-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800 p-6 rounded-xl text-center">
            <p className="text-gray-400">
              Waiting for another person to join...
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {mode === "create"
                ? "Share the code above with your match"
                : "The host will start the session soon"}
            </p>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              if (socketRef.current) {
                socketRef.current.disconnect();
              }
              setMode(null);
              setJamCode("");
              setJoinCode("");
              setParticipants(0);
              setCurrentTrack(null);
              setMessages([]);
              setNewMessage("");
            }}
            className="text-gray-400 hover:text-white underline"
          >
            Leave Jam Session
          </button>
        </div>
      </div>
    </div>
  );
}
