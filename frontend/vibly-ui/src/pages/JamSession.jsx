import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";

export default function JamSession() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const matchId = searchParams.get("matchId");
  const accepted = searchParams.get("accepted") === "true";
  
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
  const [userId, setUserId] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [matches, setMatches] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [otherParticipantName, setOtherParticipantName] = useState("");
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [youtubeVideoId, setYoutubeVideoId] = useState(null);
  const [youtubePlayer, setYoutubePlayer] = useState(null);
  const socketRef = useRef(null);
  const audioRef = useRef(null);
  const youtubePlayerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const notificationSentRef = useRef(false);

  // Check authentication on mount and get user info
  useEffect(() => {
    const currentUserId = localStorage.getItem("userId");
    if (!currentUserId) {
      navigate("/login");
      return;
    }
    setUserId(currentUserId);
    
    // Fetch user name
    const fetchUserName = async () => {
      try {
        const res = await axios.get(`http://localhost:5001/api/user/${currentUserId}`);
        setUserName(res.data.name || "User");
      } catch (err) {
        console.error("Error fetching user name:", err);
        setUserName("User");
      }
    };
    fetchUserName();

    // Fetch matches for invite functionality
    const fetchMatches = async () => {
      try {
        const res = await axios.get(`http://localhost:5001/api/match/${currentUserId}`);
        setMatches(res.data.matches || []);
      } catch (err) {
        console.error("Error fetching matches:", err);
      }
    };
    fetchMatches();
  }, [navigate]);

  // Initialize socket connection (only once)
  useEffect(() => {
    if (!socketRef.current) {
      try {
        socketRef.current = io("http://localhost:5001", {
          transports: ["websocket"],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
        });

        socketRef.current.on("connect", () => {
          console.log("Connected to server");
          setIsConnected(true);
          if (userId) {
            socketRef.current.emit("registerUser", userId);
          }
        });

        socketRef.current.on("disconnect", (reason) => {
          console.log("Disconnected from server, reason:", reason);
          setIsConnected(false);
          // Don't do anything that could cause a reload
        });

        socketRef.current.on("connect_error", (error) => {
          console.error("Socket connection error:", error);
          // Don't do anything that could cause a reload
        });

        // Listen for participant count updates
        socketRef.current.on("participantsUpdate", (data) => {
        const newCount = data.count;
        console.log("[JamSession] Received participantsUpdate:", newCount);
        // Update count, but use debouncing logic to prevent rapid flickering
        setParticipants((prevCount) => {
          // If we're getting a valid increase, always accept it
          if (newCount > prevCount) {
            return newCount;
          }
          // If we're getting a decrease but still > 0, accept it (someone left)
          if (newCount > 0 && newCount < prevCount) {
            return newCount;
          }
          // If we get 0 but we had a count before, be cautious - might be a temporary issue
          // Only update to 0 if we're sure (e.g., we just joined and got 0, or it's been 0 for a while)
          if (newCount === 0) {
            // If we just started (prevCount is 0 or 1), accept 0
            if (prevCount <= 1) {
              return newCount;
            }
            // Otherwise, keep previous count (might be a temporary disconnect)
            return prevCount;
          }
          // For any other case, accept the new count
          return newCount;
        });
      });

      // Listen for track changes from other participants
      socketRef.current.on("trackChange", async (data) => {
        try {
          setCurrentTrack(data.track);
          setIsPlaying(data.isPlaying);
          if (data.track && audioRef.current && data.track.preview_url) {
            // Stop current playback
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            
            // Set new source
            audioRef.current.src = data.track.preview_url;
            audioRef.current.load();
            
            try {
              if (data.isPlaying) {
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                  await playPromise;
                }
              } else {
                audioRef.current.pause();
              }
            } catch (err) {
              console.error("Error playing track from socket:", err);
              setIsPlaying(false);
            }
          }
        } catch (err) {
          console.error("Error handling track change:", err);
          // Don't let errors disconnect the socket
        }
      });

      // Listen for playback state changes
      socketRef.current.on("playbackState", async (data) => {
        try {
          setIsPlaying((prevPlaying) => {
            const newPlaying = data.isPlaying;
            
            // Control audio playback
            if (audioRef.current) {
              // Get current track from state using a ref or closure
              const currentSrc = audioRef.current.src;
              if (currentSrc && currentSrc !== '') {
                try {
                  if (newPlaying) {
                    const playPromise = audioRef.current.play();
                    if (playPromise !== undefined) {
                      playPromise.catch((err) => {
                        console.error("Error playing audio from playbackState:", err);
                      });
                    }
                  } else {
                    audioRef.current.pause();
                  }
                } catch (err) {
                  console.error("Error controlling playback from socket:", err);
                  return prevPlaying; // Keep previous state on error
                }
              }
            }
            
            return newPlaying;
          });
        } catch (err) {
          console.error("Error handling playback state:", err);
          // Don't let errors disconnect the socket
        }
      });

      // Listen for chat messages
      socketRef.current.on("receiveMessage", (data) => {
        console.log("[JamSession] Received message via socket:", data);
        
        // Force a state update to ensure React re-renders
        setMessages((prev) => {
          // Get current userId from localStorage to avoid closure issues
          const currentUserId = localStorage.getItem("userId");
          
          // If this is our own message coming back, replace the optimistic message
          if (data.senderId === currentUserId) {
            // Find and replace the optimistic message (has temp ID)
            const optimisticIndex = prev.findIndex(
              msg => msg.id && msg.id.startsWith('temp-') && 
              msg.senderId === data.senderId && 
              msg.message === data.message
            );
            
            if (optimisticIndex !== -1) {
              console.log("[JamSession] Replacing optimistic message with server message");
              const newMessages = [...prev];
              newMessages[optimisticIndex] = data;
              // Force a new array reference to ensure React detects the change
              return newMessages;
            }
          }
          
          // Check if message already exists (by timestamp, senderId, and message content)
          // Use a more lenient check to avoid blocking legitimate messages
          const exists = prev.some((msg) => {
            // Match if same sender, same message content, and timestamp within 2 seconds
            // This handles cases where timestamps might differ slightly
            const timeDiff = Math.abs((msg.timestamp || 0) - (data.timestamp || 0));
            return (
              msg.senderId === data.senderId &&
              msg.message === data.message &&
              timeDiff < 2000 // Within 2 seconds (more lenient)
            );
          });
          
          if (exists) {
            console.log("[JamSession] Message already exists, skipping duplicate");
            // Still return a new array reference to ensure React knows we checked
            return [...prev];
          }
          
          console.log("[JamSession] Adding new message to chat");
          // Always return a new array to ensure React detects the change
          return [...prev, data];
        });
      });
      } catch (error) {
        console.error("Error initializing socket:", error);
        // Don't do anything that could cause a reload
      }
    }

    return () => {
      // Don't disconnect on cleanup - keep connection alive
    };
  }, []);

  // Register user when userId is available
  useEffect(() => {
    if (socketRef.current && userId && socketRef.current.connected) {
      socketRef.current.emit("registerUser", userId);
    }
  }, [userId]);

  // Initialize jam session when matchId is provided
  useEffect(() => {
    if (!userId || !matchId) return;

    // Generate room ID from sorted user IDs (same pattern as chat)
    const sortedIds = [userId, matchId].sort();
    const jamRoomId = `jam-${sortedIds.join("-")}`;
    setRoomId(jamRoomId);
    console.log(`[JamSession] Generated room ID: ${jamRoomId} for users: ${userId} and ${matchId}`);

    // Fetch other participant's name and notify them (only once)
    const fetchOtherParticipant = async () => {
      try {
        const res = await axios.get(`http://localhost:5001/api/user/${matchId}`);
        setOtherParticipantName(res.data.name || "User");
        
        // Send notification to the other person to join the jam session (only once)
        // Skip if this is an accepted invite (they're joining, not initiating)
        if (!notificationSentRef.current && !accepted) {
          notificationSentRef.current = true;
          try {
            await axios.post("http://localhost:5001/api/jam/invite", {
              fromUserId: userId,
              toUserId: matchId,
              roomId: jamRoomId
            });
          } catch (err) {
            console.error("Error sending jam session notification:", err);
          }
        }
      } catch (err) {
        console.error("Error fetching other participant:", err);
      }
    };
    fetchOtherParticipant();

    // Join jam room - simplified and more reliable
    const joinJamRoom = async () => {
      // Wait for socket to be ready
      const waitForSocket = () => {
        return new Promise((resolve) => {
          if (socketRef.current && socketRef.current.connected) {
            resolve();
          } else if (socketRef.current) {
            const onConnect = () => {
              socketRef.current.off("connect", onConnect);
              resolve();
            };
            socketRef.current.on("connect", onConnect);
          } else {
            // Wait a bit for socket to initialize
            const checkInterval = setInterval(() => {
              if (socketRef.current) {
                clearInterval(checkInterval);
                if (socketRef.current.connected) {
                  resolve();
                } else {
                  const onConnectHandler = () => {
                    socketRef.current.off("connect", onConnectHandler);
                    resolve();
                  };
                  socketRef.current.on("connect", onConnectHandler);
                }
              }
            }, 50);
            setTimeout(() => clearInterval(checkInterval), 3000);
          }
        });
      };

      try {
        await waitForSocket();

        if (!socketRef.current || !socketRef.current.connected) {
          console.error("[JamSession] Socket not connected after waiting");
          return;
        }

        console.log("========================================");
        console.log("[JamSession] ===== JOINING JAM ROOM =====");
        console.log("[JamSession] Room ID:", jamRoomId);
        console.log("[JamSession] User ID:", userId);
        console.log("[JamSession] Match ID:", matchId);
        console.log("[JamSession] Socket ID:", socketRef.current.id);
        console.log("[JamSession] Socket connected:", socketRef.current.connected);
        console.log("========================================");
        
        // Store room ID in window for easy debugging
        window.currentJamRoomId = jamRoomId;
        console.log("[JamSession] Room ID stored in window.currentJamRoomId for debugging");
        
        // Register user first
        socketRef.current.emit("registerUser", userId);
        
        // Join the socket.io room
        socketRef.current.emit("joinRoom", jamRoomId);
        
        // Join the jam room (this tracks participants)
        socketRef.current.emit("joinJamRoom", { 
          roomId: jamRoomId,
          userId: userId,
          matchId: matchId
        });
        
        console.log("[JamSession] Emitted all join events");
        
        // Request participant count after a short delay to let backend process
        setTimeout(() => {
          if (socketRef.current && socketRef.current.connected) {
            console.log("[JamSession] Requesting participant count");
            socketRef.current.emit("getParticipantCount", { roomId: jamRoomId });
          }
        }, 300);
        
        // Load previous messages
        try {
          const res = await axios.get(`http://localhost:5001/api/chat/${jamRoomId}`);
          const messages = res.data.messages || [];
          console.log("[JamSession] Loaded messages:", messages.length);
          
          // Fetch sender names for messages that don't have them
          const messagesWithNames = await Promise.all(
            messages.map(async (msg) => {
              if (msg.senderName) {
                return msg;
              }
              try {
                const userRes = await axios.get(`http://localhost:5001/api/user/${msg.senderId}`);
                return {
                  ...msg,
                  senderName: userRes.data.name || "User"
                };
              } catch (err) {
                console.error("Error fetching sender name:", err);
                return { ...msg, senderName: "User" };
              }
            })
          );
          
          setMessages(messagesWithNames);
        } catch (err) {
          console.error("[JamSession] Error loading messages:", err);
        }
      } catch (err) {
        console.error("[JamSession] Error joining jam room:", err);
      }
    };

    // Join immediately when matchId or userId changes
    joinJamRoom();
  }, [userId, matchId]);

  // Periodically request participant count to keep it in sync (less frequently to avoid flickering)
  useEffect(() => {
    if (!roomId || !socketRef.current) return;

    // Request count less frequently to avoid race conditions
    const interval = setInterval(() => {
      if (socketRef.current && socketRef.current.connected && roomId) {
        socketRef.current.emit("getParticipantCount", { roomId });
      }
    }, 5000); // Check every 5 seconds (reduced frequency)

    return () => clearInterval(interval);
  }, [roomId]);

  // Poll for new messages every 200ms to ensure messages appear automatically
  useEffect(() => {
    if (!roomId) return;

    // Cache for sender names to avoid repeated API calls
    const senderNameCache = new Map();

    const loadMessages = async () => {
      try {
        const res = await axios.get(`http://localhost:5001/api/chat/${roomId}`);
        const newMessages = res.data.messages || [];
        
        // Fetch sender names only for messages that don't have them and aren't in cache
        const messagesWithNames = await Promise.all(
          newMessages.map(async (msg) => {
            if (msg.senderName) {
              return msg;
            }
            
            // Check cache first
            if (senderNameCache.has(msg.senderId)) {
              return {
                ...msg,
                senderName: senderNameCache.get(msg.senderId)
              };
            }
            
            // Fetch from API if not in cache
            try {
              const userRes = await axios.get(`http://localhost:5001/api/user/${msg.senderId}`);
              const name = userRes.data.name || "User";
              senderNameCache.set(msg.senderId, name);
              return {
                ...msg,
                senderName: name
              };
            } catch (err) {
              senderNameCache.set(msg.senderId, "User");
              return { ...msg, senderName: "User" };
            }
          })
        );

        // Only update if messages have changed (to avoid unnecessary re-renders)
        setMessages((prev) => {
          // Quick check: if length is different, definitely update
          if (prev.length !== messagesWithNames.length) {
            return messagesWithNames;
          }
          
          // Check if any message content has changed
          const hasChanges = prev.some((prevMsg, idx) => {
            const newMsg = messagesWithNames[idx];
            return !newMsg || 
                   prevMsg.message !== newMsg.message ||
                   prevMsg.timestamp !== newMsg.timestamp ||
                   prevMsg.senderId !== newMsg.senderId;
          });
          
          if (hasChanges || messagesWithNames.length > prev.length) {
            return messagesWithNames;
          }
          
          return prev;
        });
      } catch (err) {
        // Silently fail - don't spam console with errors
      }
    };

    // Load immediately
    loadMessages();

    // Then poll every 200ms
    const interval = setInterval(loadMessages, 200);

    return () => clearInterval(interval);
  }, [roomId]);

  const handlePlayPause = async () => {
    const newPlayingState = !isPlaying;
    setIsPlaying(newPlayingState);
    
    // Control YouTube player if available
    if (youtubeVideoId && youtubePlayerRef.current) {
      // YouTube iframe API would be needed for programmatic control
      // For now, users can use YouTube's built-in controls
      // The iframe will autoplay if isPlaying is true
      if (newPlayingState) {
        // Reload iframe with autoplay
        setYoutubeVideoId(youtubeVideoId); // Trigger re-render with autoplay
      }
    }
    
    // Emit playback control via socket (don't let errors here disconnect socket)
    if (socketRef.current && socketRef.current.connected && roomId) {
      try {
        socketRef.current.emit("playbackControl", {
          roomId: roomId,
          isPlaying: newPlayingState,
        });
      } catch (socketErr) {
        console.error("Error emitting playback control:", socketErr);
        // Don't let socket errors affect playback
      }
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
      youtubeQuery: track.youtubeQuery || `${track.name} ${track.artists?.map(a => a.name).join(' ')}`
    };
    
    setCurrentTrack(trackData);
    setSearchQuery("");
    setSearchResults([]);
    setIsAudioLoading(true);
    
    let videoId = null;
    
    // Search YouTube for the full song
    try {
      const youtubeResponse = await axios.get(
        `http://localhost:5001/api/search/youtube?q=${encodeURIComponent(trackData.youtubeQuery)}`
      );
      
      console.log("YouTube response:", youtubeResponse.data);
      
      if (youtubeResponse.data.videoId) {
        videoId = youtubeResponse.data.videoId;
        setYoutubeVideoId(videoId);
        setIsPlaying(true);
      } else if (youtubeResponse.data.error) {
        // If API key is not configured, fallback to Spotify preview if available
        console.warn("YouTube API error:", youtubeResponse.data.error);
        
        if (trackData.preview_url && audioRef.current) {
          // Fallback to Spotify preview
          console.log("Falling back to Spotify preview");
          setYoutubeVideoId(null);
          try {
            audioRef.current.src = trackData.preview_url;
            audioRef.current.load();
            await audioRef.current.play();
            setIsPlaying(true);
            setErrorMessage("Playing 30-second preview. Configure YouTube API key for full songs.");
            setTimeout(() => setErrorMessage(""), 5000);
          } catch (audioErr) {
            console.error("Error playing preview:", audioErr);
            setErrorMessage("Could not play preview. Please configure YouTube API key for full songs.");
            setTimeout(() => setErrorMessage(""), 7000);
            setIsPlaying(false);
          }
        } else {
          // No preview available
          setErrorMessage("No preview available. Please configure YouTube API key in backend .env to play full songs.");
          setTimeout(() => setErrorMessage(""), 8000);
          setIsPlaying(false);
        }
      } else {
        setErrorMessage("Could not find video on YouTube. Please try another song.");
        setTimeout(() => setErrorMessage(""), 5000);
        setIsPlaying(false);
      }
    } catch (err) {
      console.error("Error searching YouTube:", err);
      console.error("Error details:", err.response?.data || err.message);
      
      // Try fallback to Spotify preview if available
      if (trackData.preview_url && audioRef.current) {
        try {
          console.log("Error with YouTube, trying Spotify preview fallback");
          setYoutubeVideoId(null);
          audioRef.current.src = trackData.preview_url;
          audioRef.current.load();
          await audioRef.current.play();
          setIsPlaying(true);
          setErrorMessage("Playing 30-second preview. Configure YouTube API key for full songs.");
          setTimeout(() => setErrorMessage(""), 5000);
        } catch (audioErr) {
          console.error("Preview also failed:", audioErr);
          setErrorMessage(`Could not load video or preview. Please configure YouTube API key. Error: ${err.response?.data?.error || err.message}`);
          setTimeout(() => setErrorMessage(""), 8000);
          setIsPlaying(false);
        }
      } else {
        setErrorMessage(`Could not load video. Please configure YouTube API key. Error: ${err.response?.data?.error || err.message}`);
        setTimeout(() => setErrorMessage(""), 8000);
        setIsPlaying(false);
      }
    } finally {
      setIsAudioLoading(false);
    }
    
    // Emit track change via socket (don't let errors here disconnect socket)
    if (socketRef.current && socketRef.current.connected && roomId) {
      try {
        socketRef.current.emit("trackChange", {
          roomId: roomId,
          track: trackData,
          isPlaying: true,
          youtubeVideoId: videoId
        });
      } catch (socketErr) {
        console.error("Error emitting track change:", socketErr);
        // Don't let socket errors affect playback
      }
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await axios.get(
        `http://localhost:5001/api/search/tracks?q=${encodeURIComponent(searchQuery)}`
      );
      // Show all tracks - we'll use YouTube for full playback
      const allTracks = response.data.results || [];
      // Add YouTube search query for each track
      const tracksWithYouTube = allTracks.map(track => ({
        ...track,
        youtubeQuery: `${track.name} ${track.artists?.map(a => a.name).join(' ')}`
      }));
      setSearchResults(tracksWithYouTube);
      console.log(`Found ${tracksWithYouTube.length} tracks`);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
      setErrorMessage("Error searching for tracks. Please try again.");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setIsSearching(false);
    }
  };

  const sendMessage = async (e) => {
    try {
      // Prevent form submission and default behavior
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      if (!newMessage.trim() || !socketRef.current || !roomId) {
        console.log("[JamSession] Cannot send message - missing:", {
          hasMessage: !!newMessage.trim(),
          hasSocket: !!socketRef.current,
          hasRoomId: !!roomId,
          socketConnected: socketRef.current?.connected
        });
        return false; // Return false to prevent any default behavior
      }
      
      const messageText = newMessage.trim();
      const timestamp = Date.now();
      const messageData = {
        room: roomId,
        roomId: roomId,
        senderId: userId,
        senderName: userName,
        message: messageText,
        timestamp: timestamp
      };
      
      // Clear input first
      setNewMessage("");
      
      // Optimistically add message to local state with a unique ID to help with duplicate detection
      const optimisticMessage = {
        ...messageData,
        id: `temp-${timestamp}-${userId}` // Temporary ID for optimistic message
      };
      setMessages((prev) => [...prev, optimisticMessage]);
      
      // Emit message via socket (wrap in try-catch to prevent disconnection)
      console.log("[JamSession] Sending message via socket:", messageData);
      if (socketRef.current) {
        // Check connection status without throwing
        const isConnected = socketRef.current.connected;
        if (isConnected) {
          try {
            socketRef.current.emit("sendMessage", messageData);
          } catch (socketError) {
            console.error("[JamSession] Error emitting message:", socketError);
            // Don't remove optimistic message - let polling handle it
            // Don't throw - just log the error
          }
        } else {
          console.warn("[JamSession] Socket not connected, message will be saved via API only");
          // Don't remove optimistic message - it will be handled by polling
        }
      } else {
        console.error("[JamSession] Socket ref is null");
        return false;
      }
      
      // Also save to backend (fire and forget - don't wait for it)
      axios.post("http://localhost:5001/api/chat/send", {
        roomId: roomId,
        senderId: userId,
        message: messageText
      }).then(() => {
        console.log("[JamSession] Message saved to backend");
      }).catch((err) => {
        console.error("[JamSession] Error saving message:", err);
        // Don't do anything - just log the error
      });
      
      return false; // Always return false to prevent any default behavior
    } catch (error) {
      // Catch any unexpected errors
      console.error("[JamSession] Unexpected error in sendMessage:", error);
      return false; // Prevent any default behavior
    }
  };

  const handleInviteMatch = async (inviteMatchId) => {
    try {
      await axios.post("http://localhost:5001/api/jam/invite", {
        fromUserId: userId,
        toUserId: inviteMatchId,
        roomId: roomId
      });
      alert("Invite sent!");
      setShowInviteModal(false);
    } catch (err) {
      console.error("Error sending invite:", err);
      alert("Failed to send invite");
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // If no matchId, redirect to match list
  if (!matchId) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center p-6">
        <div className="bg-slate-800 p-10 rounded-xl w-full max-w-md shadow-lg text-center">
          <h1 className="text-3xl font-bold mb-4">Jam Session</h1>
          <p className="text-gray-400 mb-6">
            Please start a jam session from a match profile.
          </p>
          <button
            onClick={() => navigate("/match-list")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Go to Matches
          </button>
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
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span className="text-sm text-gray-400">
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
              {matches.length > 0 && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-sm font-semibold"
                >
                  + Invite Match
                </button>
              )}
            </div>
          </div>
          
          {/* Participants Info */}
          <div className="bg-slate-900 p-4 rounded-lg">
            <div className="text-center">
              {isConnected && otherParticipantName ? (
                <p className="text-lg text-white">
                  You are now in a jam session with <span className="font-semibold">{otherParticipantName}</span>
                </p>
              ) : (
                <p className="text-lg text-gray-400">Connecting to jam session...</p>
              )}
            </div>
          </div>
          
          {/* Error Message Toast */}
          {errorMessage && (
            <div className="fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-md">
              <div className="flex items-center justify-between gap-4">
                <p>{errorMessage}</p>
                <button
                  onClick={() => setErrorMessage("")}
                  className="text-white hover:text-gray-200 font-bold text-xl"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Grid - Music Player and Chat Side by Side */}
        {isConnected && matchId ? (
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
                        className="w-full p-3 hover:bg-slate-800 text-left flex items-center gap-3 transition-colors cursor-pointer"
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
                        <span className="text-xs text-green-400">▶ Play</span>
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
                  
                  {/* YouTube Player or Audio Player */}
                  {youtubeVideoId ? (
                    <div className="w-full">
                      <div className="relative" style={{ paddingBottom: "56.25%", height: 0, overflow: "hidden" }}>
                        <iframe
                          ref={youtubePlayerRef}
                          width="100%"
                          height="100%"
                          src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=${isPlaying ? 1 : 0}&controls=1&rel=0&enablejsapi=1`}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute top-0 left-0 w-full h-full rounded-lg"
                          title={currentTrack.name}
                          key={youtubeVideoId}
                        />
                      </div>
                    </div>
                  ) : currentTrack?.preview_url ? (
                    <div className="w-full">
                      <div className="bg-slate-900 p-4 rounded-lg text-center">
                        <p className="text-gray-400 mb-2">Playing 30-second preview</p>
                        <p className="text-xs text-yellow-400 mb-4">
                          Configure YouTube API key for full songs
                        </p>
                        <audio
                          ref={audioRef}
                          src={currentTrack.preview_url}
                          controls
                          className="w-full"
                          autoPlay={isPlaying}
                        />
                      </div>
                    </div>
                  ) : isAudioLoading ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400">Searching for video on YouTube...</p>
                      <p className="text-xs text-gray-500 mt-2">This may take a moment</p>
                    </div>
                  ) : currentTrack ? (
                    <div className="text-center py-8 text-gray-400">
                      <p>Could not load video or preview</p>
                      <p className="text-xs mt-2 text-yellow-400">
                        Please configure YouTube API key in backend .env file
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <p>Video will appear here when a track is selected</p>
                    </div>
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
                        msg.senderId === userId
                          ? "text-right"
                          : "text-left"
                      }`}
                    >
                      <div
                        className={`inline-block p-3 rounded-lg max-w-xs ${
                          msg.senderId === userId
                            ? "bg-blue-600 text-white"
                            : "bg-slate-700 text-white"
                        }`}
                      >
                        {msg.senderId !== userId && (
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      e.stopPropagation();
                      sendMessage(e);
                    }
                  }}
                  className="flex-1 p-3 rounded bg-slate-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    sendMessage(e);
                  }}
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
              Waiting for {otherParticipantName || "your match"} to join...
            </p>
            <p className="text-sm text-gray-500 mt-2">
              They will receive a notification to join the jam session
            </p>
          </div>
        )}

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 p-6 rounded-xl max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold mb-4">Invite a Match</h2>
              <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
                {matches.filter(m => m.userId !== matchId).length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No other matches to invite</p>
                ) : (
                  matches
                    .filter(m => m.userId !== matchId)
                    .map((match) => (
                      <button
                        key={match.userId}
                        onClick={() => handleInviteMatch(match.userId)}
                        className="w-full p-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-left flex items-center gap-3"
                      >
                        <div className="flex-1">
                          <p className="font-semibold">{match.name}</p>
                        </div>
                        <span className="text-blue-400">Invite</span>
                      </button>
                    ))
                )}
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="w-full bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              if (socketRef.current) {
                socketRef.current.disconnect();
              }
              navigate("/match-list");
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
