import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";

function WatchParty() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const matchId = searchParams.get("matchId");
  const fromNotification = searchParams.get("fromNotification") === "true";
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null); // Currently playing content
  const [selectedContentList, setSelectedContentList] = useState([]); // List of all selected content
  const [loading, setLoading] = useState(true);
  const [matchedUser, setMatchedUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showContentBrowser, setShowContentBrowser] = useState(false);
  const [contentType, setContentType] = useState("movies"); // "movies" or "tv"
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recommendedContent, setRecommendedContent] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [scenerInstalled, setScenerInstalled] = useState(false);
  const [showScenerInstructions, setShowScenerInstructions] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinLink, setJoinLink] = useState("");
  const [watchPartyCode, setWatchPartyCode] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch matched user info
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
          navigate("/login");
          return;
        }

        // Fetch current user
        const currentUserRes = await axios.get(`http://localhost:5001/api/user/${userId}`);
        setCurrentUser(currentUserRes.data);

        // Fetch matched user if matchId provided
        if (matchId) {
          try {
            const matchedUserRes = await axios.get(`http://localhost:5001/api/user/${matchId}`);
            setMatchedUser(matchedUserRes.data);
            console.log("Matched user loaded:", matchedUserRes.data.name);
          } catch (err) {
            console.error("Error fetching matched user:", err);
            // If user not found, show error
            alert("Unable to load match profile. Please check the watch party link.");
          }
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [matchId, navigate]);

  // Check if Scener extension is installed
  useEffect(() => {
    // Check for Scener extension
    const checkScener = () => {
      // Scener extension injects a global object
      if (window.scener || document.querySelector('[data-scener]')) {
        setScenerInstalled(true);
        return;
      }
      
      // Try to detect Scener by checking for its common identifiers
      // Scener typically adds classes or data attributes
      setTimeout(() => {
        if (document.querySelector('.scener') || document.querySelector('[data-scener-extension]')) {
          setScenerInstalled(true);
        }
      }, 1000);
    };
    
    checkScener();
    
    // Listen for Scener messages if available
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SCENER_EXTENSION_READY') {
        setScenerInstalled(true);
      }
    });
  }, []);

  // Track if notification has been sent
  const [notificationSent, setNotificationSent] = useState(false);

  // Generate room ID and connect to socket
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId || !matchId) return;

    // Generate room ID from user IDs (sorted to ensure consistency)
    const currentRoomId = [userId, matchId].sort().join("-watch");
    setRoomId(currentRoomId);
    
    // Generate a shareable code from room ID (first 8 characters of hash)
    const code = currentRoomId.split('-').slice(0, 2).map(id => id.slice(0, 4)).join('-').toUpperCase();
    setWatchPartyCode(code);

    // Send notification to the other user when watch party is started
    // Only send if user is NOT coming from a notification (they're the initiator)
    // Note: If notification was already sent from MatchList button click, skip here
    const sendWatchPartyNotification = async () => {
      if (notificationSent || fromNotification) return; // Don't send if already sent or if joining from notification
      
      // Check if notification was sent via URL parameter (from MatchList)
      const notificationAlreadySent = searchParams.get("notificationSent") === "true";
      if (notificationAlreadySent) {
        console.log("Notification already sent from MatchList, skipping duplicate");
        setNotificationSent(true);
        return;
      }
      
      try {
        await axios.post("http://localhost:5001/api/watch-party/start", {
          userId,
          matchId
        });
        setNotificationSent(true);
        console.log("Watch party notification sent to", matchId);
      } catch (err) {
        console.error("Error sending watch party notification:", err);
        // Don't block the watch party if notification fails
      }
    };

    // Send notification when component mounts (user started watch party, not joining)
    // This is a fallback for direct navigation - notification is usually sent from MatchList button
    if (!fromNotification) {
      sendWatchPartyNotification();
    }

    // Connect to socket
    const newSocket = io("http://localhost:5001", {
      transports: ["websocket"]
    });

    newSocket.on("connect", () => {
      console.log("Connected to socket, joining room:", currentRoomId);
      setSocketConnected(true);
      // Register user for notifications
      newSocket.emit("registerUser", userId);
      // Join the watch party room
      newSocket.emit("joinRoom", currentRoomId);
      console.log(`User ${userId} registered and joined room ${currentRoomId}`);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setSocketConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setSocketConnected(false);
    });

    newSocket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    newSocket.on("receiveMessage", (data) => {
      console.log("Received message in room:", currentRoomId, "Message:", data);
      setMessages((prev) => {
        // Check if message already exists to avoid duplicates
        const exists = prev.some(m => 
          m.id === data.id || 
          (m.senderId === data.senderId && 
           m.message === data.message && 
           Math.abs((m.timestamp || 0) - (data.timestamp || 0)) < 1000)
        );
        if (exists) {
          console.log("Duplicate message detected, skipping");
          return prev;
        }
        console.log("Adding new message to chat");
        return [...prev, data];
      });
    });

    // Listen for content selection changes
    newSocket.on("contentSelected", (data) => {
      if (data.content) {
        setSelectedContent(data.content);
      }
      if (data.contentList) {
        setSelectedContentList(data.contentList);
      }
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
  }, [matchId, notificationSent, fromNotification]);

  // Load recommended content based on both users' preferences
  useEffect(() => {
    const loadRecommendations = async () => {
      if (!currentUser || !matchedUser) return;

      setLoadingRecommendations(true);
      try {
        // Get both users' preferences
        const userId = localStorage.getItem("userId");
        const [currentUserPrefs, matchedUserPrefs] = await Promise.all([
          axios.get(`http://localhost:5001/api/taste/${userId}`),
          axios.get(`http://localhost:5001/api/taste/${matchId}`)
        ]);

        const currentMovies = currentUserPrefs.data?.movies || [];
        const matchedMovies = matchedUserPrefs.data?.movies || [];
        const currentShows = currentUserPrefs.data?.shows || [];
        const matchedShows = matchedUserPrefs.data?.shows || [];

        // Find common preferences or get popular content
        const allMovieIds = [...new Set([...currentMovies, ...matchedMovies].map(m => m.id || m.tmdbId).filter(Boolean))];
        const allShowIds = [...new Set([...currentShows, ...matchedShows].map(s => s.id || s.tmdbId).filter(Boolean))];

        // Get popular content if no common preferences
        if (allMovieIds.length === 0 && allShowIds.length === 0) {
          const [moviesRes, showsRes] = await Promise.all([
            axios.get("http://localhost:5001/api/search/movies"),
            axios.get("http://localhost:5001/api/search/tv")
          ]);
          setRecommendedContent([
            ...(moviesRes.data.results || []).slice(0, 10).map(m => ({ ...m, type: "movie" })),
            ...(showsRes.data.results || []).slice(0, 10).map(s => ({ ...s, type: "tv" }))
          ]);
        } else {
          // Use common preferences or popular content
          const [moviesRes, showsRes] = await Promise.all([
            axios.get("http://localhost:5001/api/search/movies"),
            axios.get("http://localhost:5001/api/search/tv")
          ]);
          setRecommendedContent([
            ...(moviesRes.data.results || []).slice(0, 10).map(m => ({ ...m, type: "movie" })),
            ...(showsRes.data.results || []).slice(0, 10).map(s => ({ ...s, type: "tv" }))
          ]);
        }
      } catch (err) {
        console.error("Error loading recommendations:", err);
        // Fallback to popular content
        try {
          const [moviesRes, showsRes] = await Promise.all([
            axios.get("http://localhost:5001/api/search/movies"),
            axios.get("http://localhost:5001/api/search/tv")
          ]);
          setRecommendedContent([
            ...(moviesRes.data.results || []).slice(0, 10).map(m => ({ ...m, type: "movie" })),
            ...(showsRes.data.results || []).slice(0, 10).map(s => ({ ...s, type: "tv" }))
          ]);
        } catch (fallbackErr) {
          console.error("Error loading fallback content:", fallbackErr);
        }
      } finally {
        setLoadingRecommendations(false);
      }
    };

    if (currentUser && matchedUser) {
      loadRecommendations();
    }
  }, [currentUser, matchedUser, matchId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Search content with debounce
  useEffect(() => {
    if (!showContentBrowser || !searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const endpoint = contentType === "movies" 
          ? "http://localhost:5001/api/search/movies"
          : "http://localhost:5001/api/search/tv";
        
        const response = await axios.get(endpoint, {
          params: { q: searchQuery.trim() }
        });
        
        setSearchResults(response.data.results || []);
      } catch (err) {
        console.error("Error searching content:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, contentType, showContentBrowser]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !socket || !roomId) {
      console.warn("Cannot send message - missing:", { socket: !!socket, roomId, message: newMessage.trim() });
      return;
    }

    // Check if socket is connected
    if (!socket.connected) {
      console.warn("Socket not connected, attempting to reconnect...");
      alert("Connection lost. Please refresh the page.");
      return;
    }

    const userId = localStorage.getItem("userId");
    const messageData = {
      roomId,
      room: roomId, // Also include 'room' for socket routing
      senderId: userId,
      message: newMessage.trim(),
      timestamp: Date.now()
    };

    // Send via socket (include room property for backend routing)
    console.log("Sending message to room:", roomId, "from user:", userId);
    console.log("Socket connected:", socket.connected, "Socket ID:", socket.id);
    
    socket.emit("sendMessage", {
      ...messageData,
      room: roomId
    });
    
    // Optimistically add message to UI
    setMessages((prev) => [...prev, messageData]);

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

  const addContentToList = (content) => {
    // Check if content already exists in list
    const exists = selectedContentList.some(
      item => item.id === content.id && item.type === content.type
    );
    
    if (!exists) {
      const updatedList = [...selectedContentList, { ...content, type: content.type || contentType }];
      setSelectedContentList(updatedList);
      
      // If no content is currently selected, select this one
      if (!selectedContent) {
        setSelectedContent(content);
      }
      
      // Notify other user via socket
      if (socket && roomId) {
        socket.emit("contentSelected", {
          roomId,
          contentList: updatedList,
          content: selectedContent || content
        });
      }
    }
  };

  const removeContentFromList = (contentId, itemType) => {
    const updatedList = selectedContentList.filter(
      item => item.id !== contentId
    );
    setSelectedContentList(updatedList);
    
    // If removed content was currently playing, switch to first item in list or null
    if (selectedContent && selectedContent.id === contentId) {
      setSelectedContent(updatedList.length > 0 ? updatedList[0] : null);
    }
    
    // Notify other user via socket
    if (socket && roomId) {
      socket.emit("contentSelected", {
        roomId,
        contentList: updatedList,
        content: updatedList.length > 0 ? updatedList[0] : null
      });
    }
  };

  const selectContentToPlay = (content) => {
    setSelectedContent(content);
    
    // Notify other user via socket
    if (socket && roomId) {
      socket.emit("contentSelected", {
        roomId,
        contentList: selectedContentList,
        content
      });
    }
  };

  const browseContent = async () => {
    setShowContentBrowser(true);
    setSearchQuery("");
    setSearchResults([]);
    
    // Load popular content when opening browser
    setIsSearching(true);
    try {
      const endpoint = contentType === "movies"
        ? "http://localhost:5001/api/search/movies"
        : "http://localhost:5001/api/search/tv";
      
      const response = await axios.get(endpoint);
      setSearchResults(response.data.results || []);
    } catch (err) {
      console.error("Error loading content:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const copyWatchPartyLink = () => {
    const watchPartyLink = `${window.location.origin}/watch-party?matchId=${matchId}`;
    navigator.clipboard.writeText(watchPartyLink).then(() => {
      alert("Watch Party link copied to clipboard!");
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = watchPartyLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert("Watch Party link copied to clipboard!");
    });
  };

  const copyWatchPartyCode = () => {
    navigator.clipboard.writeText(watchPartyCode).then(() => {
      alert("Watch Party code copied to clipboard!");
    }).catch(() => {
      const textArea = document.createElement("textarea");
      textArea.value = watchPartyCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert("Watch Party code copied to clipboard!");
    });
  };

  const handleJoinByCode = () => {
    if (!joinCode.trim()) {
      alert("Please enter a watch party code");
      return;
    }
    // For now, codes are derived from user IDs, so we'd need to decode
    // For simplicity, use the link instead
    alert("Please use the join link instead. Code functionality coming soon!");
  };

  const handleJoinByLink = () => {
    if (!joinLink.trim()) {
      alert("Please enter a watch party link");
      return;
    }
    
    try {
      // Extract matchId from link
      const url = new URL(joinLink.startsWith('http') ? joinLink : `http://localhost:3000${joinLink}`);
      const matchIdParam = url.searchParams.get('matchId');
      
      if (matchIdParam) {
        navigate(`/watch-party?matchId=${matchIdParam}`);
        setShowJoinModal(false);
      } else {
        alert("Invalid watch party link. Please check the link and try again.");
      }
    } catch (err) {
      alert("Invalid link format. Please enter a valid watch party link.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-white text-xl bg-[#0f172a]">
        Loading watch party...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-gray-800/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold">🎬 Watch Party</h1>
          {matchedUser && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>with</span>
              <span className="text-white font-semibold">{matchedUser.name}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {selectedContent && (
            <div className="text-sm text-gray-400">
              Now watching: <span className="text-white font-semibold">{selectedContent.title || selectedContent.name}</span>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setShowJoinModal(true)}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
            >
              ➕ Join
            </button>
            {matchId && (
              <button
                onClick={() => setShowShareModal(true)}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
              >
                📤 Share
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 p-6 flex flex-col">
          {selectedContent ? (
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 shadow-2xl h-full flex flex-col">
              {/* Content Poster/Image */}
              <div className="flex gap-6 mb-6">
                {selectedContent.posterPath && (
                  <img
                    src={selectedContent.posterPath}
                    alt={selectedContent.title || selectedContent.name}
                    className="w-48 h-72 object-cover rounded-lg shadow-xl"
                  />
                )}
                <div className="flex-1">
                  <h2 className="text-4xl font-bold mb-4">{selectedContent.title || selectedContent.name}</h2>
                  {selectedContent.overview && (
                    <p className="text-gray-300 mb-4 leading-relaxed">{selectedContent.overview}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm">
                    {selectedContent.releaseDate && (
                      <div className="text-gray-400">
                        📅 {new Date(selectedContent.releaseDate).getFullYear()}
                      </div>
                    )}
                    {selectedContent.firstAirDate && (
                      <div className="text-gray-400">
                        📅 {new Date(selectedContent.firstAirDate).getFullYear()}
                      </div>
                    )}
                    {selectedContent.voteAverage && (
                      <div className="text-gray-400">
                        ⭐ {selectedContent.voteAverage.toFixed(1)}/10
                      </div>
                    )}
                    {selectedContent.genres && selectedContent.genres.length > 0 && (
                      <div className="text-gray-400">
                        🎭 {selectedContent.genres.join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Video Player / Scener Integration */}
              <div className="flex-1 bg-black rounded-lg flex flex-col items-center justify-center relative overflow-hidden">
                {scenerInstalled ? (
                  <div className="text-center p-8">
                    <div className="text-6xl mb-4">🎬</div>
                    <p className="text-white text-xl font-semibold mb-4">
                      {selectedContent.title || selectedContent.name}
                    </p>
                    <p className="text-gray-300 mb-6">
                      Scener extension detected! Open this content on your streaming platform and use Scener to sync.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                      <a
                        href={`https://www.netflix.com/search?q=${encodeURIComponent(selectedContent.title || selectedContent.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition-colors"
                      >
                        Open on Netflix
                      </a>
                      <a
                        href={`https://www.hulu.com/search?q=${encodeURIComponent(selectedContent.title || selectedContent.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold transition-colors"
                      >
                        Open on Hulu
                      </a>
                      <a
                        href={`https://www.disneyplus.com/search?q=${encodeURIComponent(selectedContent.title || selectedContent.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors"
                      >
                        Open on Disney+
                      </a>
                      <a
                        href={`https://www.hbomax.com/search?q=${encodeURIComponent(selectedContent.title || selectedContent.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold transition-colors"
                      >
                        Open on HBO Max
                      </a>
                    </div>
                    <p className="text-gray-400 text-sm mt-6">
                      Once opened, use the Scener extension to create a watch party and invite {matchedUser?.name || "your match"}!
                    </p>
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <div className="text-6xl mb-4">🎬</div>
                    <p className="text-white text-xl font-semibold mb-2">
                      {selectedContent.title || selectedContent.name}
                    </p>
                    <p className="text-gray-400 mb-6">
                      Install Scener extension to watch together in sync!
                    </p>
                    <div className="space-y-4">
                      <a
                        href="https://www.scener.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-xl"
                      >
                        Install Scener Extension
                      </a>
                      <button
                        onClick={() => setShowScenerInstructions(!showScenerInstructions)}
                        className="block w-full text-gray-400 hover:text-white text-sm underline"
                      >
                        {showScenerInstructions ? 'Hide' : 'Show'} Instructions
                      </button>
                      {showScenerInstructions && (
                        <div className="mt-4 p-4 bg-gray-800 rounded-lg text-left text-sm text-gray-300">
                          <p className="font-semibold mb-2">How to use Scener:</p>
                          <ol className="list-decimal list-inside space-y-2">
                            <li>Install the Scener browser extension from scener.com</li>
                            <li>Open your streaming platform (Netflix, Hulu, Disney+, etc.)</li>
                            <li>Search for "{selectedContent.title || selectedContent.name}"</li>
                            <li>Click the Scener icon in your browser to create a watch party</li>
                            <li>Share the watch party link with {matchedUser?.name || "your match"}</li>
                            <li>Start watching together in sync!</li>
                          </ol>
                        </div>
                      )}
                      <div className="mt-6 flex flex-wrap gap-3 justify-center">
                        <a
                          href={`https://www.netflix.com/search?q=${encodeURIComponent(selectedContent.title || selectedContent.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
                        >
                          Netflix
                        </a>
                        <a
                          href={`https://www.hulu.com/search?q=${encodeURIComponent(selectedContent.title || selectedContent.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
                        >
                          Hulu
                        </a>
                        <a
                          href={`https://www.disneyplus.com/search?q=${encodeURIComponent(selectedContent.title || selectedContent.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
                        >
                          Disney+
                        </a>
                        <a
                          href={`https://www.hbomax.com/search?q=${encodeURIComponent(selectedContent.title || selectedContent.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
                        >
                          HBO Max
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-4">
                <button
                  onClick={browseContent}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Add More Content
                </button>
                <button
                  onClick={() => navigate("/preferences")}
                  className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Go to Preferences
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-12 text-center h-full flex flex-col items-center justify-center shadow-2xl">
              <div className="text-8xl mb-6">🎬</div>
              <h2 className="text-3xl font-bold mb-4">No Content Selected</h2>
              <p className="text-gray-400 mb-8 max-w-md">
                Choose a movie or TV show to watch together with {matchedUser?.name || "your match"}!
              </p>
              
              {/* Recommended Content */}
              {loadingRecommendations ? (
                <div className="text-gray-400">Loading recommendations...</div>
              ) : recommendedContent.length > 0 ? (
                <div className="w-full max-w-4xl">
                  <h3 className="text-xl font-semibold mb-4 text-left">Recommended for You Both</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-96 overflow-y-auto">
                    {recommendedContent.map((item, idx) => (
                      <div
                        key={`rec-${item.id}-${idx}`}
                        onClick={() => addContentToList(item)}
                        className="cursor-pointer group transform transition-all hover:scale-105"
                      >
                        <div className="bg-gray-700 rounded-lg overflow-hidden shadow-lg">
                          {item.posterPath ? (
                            <img
                              src={item.posterPath}
                              alt={item.title || item.name}
                              className="w-full aspect-[2/3] object-cover"
                            />
                          ) : (
                            <div className="w-full aspect-[2/3] bg-gray-800 flex items-center justify-center text-4xl">
                              🎬
                            </div>
                          )}
                          <div className="p-2">
                            <p className="text-sm font-semibold truncate">{item.title || item.name}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex gap-4 mt-8">
                <button
                  onClick={browseContent}
                  className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg"
                >
                  Browse Content
                </button>
                <button
                  onClick={() => navigate("/preferences")}
                  className="bg-purple-600 hover:bg-purple-700 px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg"
                >
                  Go to Preferences
                </button>
              </div>
            </div>
          )}

          {/* Selected Content List */}
          {selectedContentList.length > 0 && (
            <div className="mt-6 bg-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Your Watch List ({selectedContentList.length})</h3>
                <button
                  onClick={browseContent}
                  className="text-sm bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                >
                  + Add More
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {selectedContentList.map((item, idx) => (
                  <div
                    key={`list-${item.id}-${idx}`}
                    className={`relative group cursor-pointer transform transition-all ${
                      selectedContent && selectedContent.id === item.id
                        ? 'ring-2 ring-blue-500 scale-105'
                        : 'hover:scale-105'
                    }`}
                    onClick={() => selectContentToPlay(item)}
                  >
                    <div className="bg-gray-700 rounded-lg overflow-hidden shadow-lg">
                      {item.posterPath ? (
                        <img
                          src={item.posterPath}
                          alt={item.title || item.name}
                          className="w-full aspect-[2/3] object-cover"
                        />
                      ) : (
                        <div className="w-full aspect-[2/3] bg-gray-800 flex items-center justify-center text-2xl">
                          🎬
                        </div>
                      )}
                      <div className="p-2">
                        <p className="text-xs font-semibold truncate">{item.title || item.name}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {item.type === "movie" || item.type === "movies" ? "🎬 Movie" : "📺 TV Show"}
                        </p>
                      </div>
                    </div>
                    {/* Remove Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeContentFromList(item.id, item.type);
                      }}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove"
                    >
                      ×
                    </button>
                    {/* Currently Playing Badge */}
                    {selectedContent && selectedContent.id === item.id && (
                      <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">
                        Playing
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chat Sidebar */}
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-gray-700 flex flex-col bg-gray-800/30">
          <div className="p-4 border-b border-gray-700 bg-gray-800/50">
            <div className="flex items-center gap-3">
              {matchedUser && (
                <>
                  {matchedUser.profileImages && matchedUser.profileImages.length > 0 ? (
                    <img
                      src={matchedUser.profileImages[0]}
                      alt={matchedUser.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : matchedUser.imageUrl ? (
                    <img
                      src={matchedUser.imageUrl}
                      alt={matchedUser.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                      {matchedUser.name?.charAt(0).toUpperCase() || '👤'}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{matchedUser.name}</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-400">💬 Chat</p>
                      <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-red-500'}`} title={socketConnected ? 'Connected' : 'Disconnected'} />
                      {roomId && (
                        <p className="text-xs text-gray-500" title={`Room: ${roomId}`}>
                          {roomId.slice(0, 8)}...
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
              {!matchedUser && (
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">💬 Chat</h3>
                  <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-red-500'}`} title={socketConnected ? 'Connected' : 'Disconnected'} />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 mt-8">
                <div className="text-4xl mb-2">💬</div>
                <p className="text-sm">No messages yet. Start chatting!</p>
                {matchedUser && (
                  <p className="text-xs text-gray-500 mt-2">with {matchedUser.name}</p>
                )}
              </div>
            ) : (
              messages.map((msg, idx) => {
                const userId = localStorage.getItem("userId");
                const isOwn = msg.senderId === userId;
                const senderName = isOwn 
                  ? (currentUser?.name || "You") 
                  : (matchedUser?.name || "Match");
                
                return (
                  <div
                    key={idx}
                    className={`flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    {!isOwn && matchedUser && (
                      <div className="flex-shrink-0">
                        {matchedUser.profileImages && matchedUser.profileImages.length > 0 ? (
                          <img
                            src={matchedUser.profileImages[0]}
                            alt={matchedUser.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : matchedUser.imageUrl ? (
                          <img
                            src={matchedUser.imageUrl}
                            alt={matchedUser.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                            {matchedUser.name?.charAt(0).toUpperCase() || '👤'}
                          </div>
                        )}
                      </div>
                    )}
                    <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                      {!isOwn && (
                        <p className="text-xs text-gray-400 mb-1 px-2">{senderName}</p>
                      )}
                      <div
                        className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                          isOwn
                            ? "bg-blue-600 text-white rounded-br-sm"
                            : "bg-gray-700 text-gray-100 rounded-bl-sm"
                        }`}
                      >
                        <p className="break-words">{msg.message}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                    {isOwn && currentUser && (
                      <div className="flex-shrink-0">
                        {currentUser.profileImages && currentUser.profileImages.length > 0 ? (
                          <img
                            src={currentUser.profileImages[0]}
                            alt={currentUser.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : currentUser.imageUrl ? (
                          <img
                            src={currentUser.imageUrl}
                            alt={currentUser.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">
                            {currentUser.name?.charAt(0).toUpperCase() || 'You'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-700 bg-gray-800/50">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-2 rounded-lg transition text-sm font-semibold"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Browser Modal */}
      {showContentBrowser && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setShowContentBrowser(false)}
        >
          <div 
            className="bg-gray-800 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Browse Content</h2>
                {selectedContentList.length > 0 && (
                  <p className="text-sm text-gray-400 mt-1">
                    {selectedContentList.length} item{selectedContentList.length !== 1 ? 's' : ''} in your watch list
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate("/preferences")}
                  className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Go to Preferences
                </button>
                <button
                  onClick={() => setShowContentBrowser(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Type Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => {
                  setContentType("movies");
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  contentType === "movies"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                🎬 Movies
              </button>
              <button
                onClick={() => {
                  setContentType("tv");
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  contentType === "tv"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                📺 TV Shows
              </button>
            </div>

            {/* Search Input */}
            <div className="mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${contentType === "movies" ? "movies" : "TV shows"}...`}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Results Grid */}
            {isSearching ? (
              <div className="text-center text-gray-400 py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2">Searching...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {searchResults.map((item) => {
                  const isInList = selectedContentList.some(
                    listItem => listItem.id === item.id && (listItem.type === item.type || listItem.type === (contentType === "movies" ? "movie" : "tv"))
                  );
                  return (
                    <div
                      key={item.id}
                      onClick={() => !isInList && addContentToList({ ...item, type: item.type || (contentType === "movies" ? "movie" : "tv") })}
                      className={`cursor-pointer group transform transition-all ${
                        isInList ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105'
                      }`}
                    >
                      <div className={`bg-gray-700 rounded-lg overflow-hidden shadow-lg ${
                        isInList ? 'ring-2 ring-green-500' : ''
                      }`}>
                        {item.posterPath ? (
                          <img
                            src={item.posterPath}
                            alt={item.title || item.name}
                            className="w-full aspect-[2/3] object-cover group-hover:opacity-80 transition-opacity"
                          />
                        ) : (
                          <div className="w-full aspect-[2/3] bg-gray-800 flex items-center justify-center text-4xl">
                            🎬
                          </div>
                        )}
                        <div className="p-3 relative">
                          {isInList && (
                            <div className="absolute top-2 right-2 bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                              ✓
                            </div>
                          )}
                          <p className="text-sm font-semibold truncate mb-1">{item.title || item.name}</p>
                          {item.releaseDate && (
                            <p className="text-xs text-gray-400">
                              {new Date(item.releaseDate).getFullYear()}
                            </p>
                          )}
                          {item.firstAirDate && (
                            <p className="text-xs text-gray-400">
                              {new Date(item.firstAirDate).getFullYear()}
                            </p>
                          )}
                          {item.voteAverage && (
                            <p className="text-xs text-gray-400">⭐ {item.voteAverage.toFixed(1)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-12">
                <div className="text-4xl mb-2">🔍</div>
                <p>No results found. Try a different search term.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Share Watch Party Modal */}
      {showShareModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setShowShareModal(false)}
        >
          <div 
            className="bg-gray-800 rounded-2xl p-8 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Share Watch Party</h2>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Share Link */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-300">
                  Share Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/watch-party?matchId=${matchId}`}
                    className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg text-sm"
                  />
                  <button
                    onClick={copyWatchPartyLink}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Send this link to {matchedUser?.name || "your match"} to join the watch party
                </p>
              </div>

              {/* Watch Party Code */}
              {watchPartyCode && (
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">
                    Watch Party Code
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-lg text-center text-2xl font-bold tracking-wider">
                      {watchPartyCode}
                    </div>
                    <button
                      onClick={copyWatchPartyCode}
                      className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Share this code with {matchedUser?.name || "your match"} to join
                  </p>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-gray-700 rounded-lg p-4">
                <p className="text-sm font-semibold mb-2">How to join:</p>
                <ol className="text-xs text-gray-300 space-y-1 list-decimal list-inside">
                  <li>Share the link or code with {matchedUser?.name || "your match"}</li>
                  <li>They can click the link or use the code to join</li>
                  <li>Both users will be in the same watch party room</li>
                  <li>You can chat and watch together in sync!</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join Watch Party Modal */}
      {showJoinModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setShowJoinModal(false)}
        >
          <div 
            className="bg-gray-800 rounded-2xl p-8 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Join Watch Party</h2>
              <button
                onClick={() => setShowJoinModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Join by Link */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-300">
                  Join by Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinLink}
                    onChange={(e) => setJoinLink(e.target.value)}
                    placeholder="Paste watch party link here..."
                    className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg text-sm"
                  />
                  <button
                    onClick={handleJoinByLink}
                    className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Join
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Paste the watch party link you received
                </p>
              </div>

              {/* Join by Code */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-300">
                  Join by Code (Coming Soon)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Enter watch party code..."
                    className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg text-sm uppercase"
                    disabled
                  />
                  <button
                    onClick={handleJoinByCode}
                    disabled
                    className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Join
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Code functionality coming soon. Use the link for now.
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-gray-700 rounded-lg p-4">
                <p className="text-sm font-semibold mb-2">How to join:</p>
                <ol className="text-xs text-gray-300 space-y-1 list-decimal list-inside">
                  <li>Check your notifications for a watch party invitation</li>
                  <li>Click the notification to join automatically, or</li>
                  <li>Copy the watch party link and paste it here</li>
                  <li>Click "Join" to start watching together!</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WatchParty;
