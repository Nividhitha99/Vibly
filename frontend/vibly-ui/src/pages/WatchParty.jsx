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
  const [scenerInstalled, setScenerInstalled] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [availableContent, setAvailableContent] = useState([]);
  const [showScenerGuide, setShowScenerGuide] = useState(false);
  const [scenerRoomCode, setScenerRoomCode] = useState("");
  const [manualConfirm, setManualConfirm] = useState(false);

  // Check if Scener extension is installed
  const checkScenerExtension = () => {
    let detected = false;

    // Method 1: Check for Scener global objects
    if (window.scener || window.Scener || window.__SCENER__) {
      detected = true;
    }

    // Method 2: Check for Scener DOM elements (common extension IDs)
    const scenerSelectors = [
      '#scener-extension',
      '#scener-root',
      '[data-scener]',
      '.scener-extension',
      '.scener-widget',
      '[id*="scener"]',
      '[class*="scener"]'
    ];
    
    for (const selector of scenerSelectors) {
      if (document.querySelector(selector)) {
        detected = true;
        break;
      }
    }

    // Method 3: Check for Scener extension via chrome-extension:// URL
    // Scener extension IDs - try to find the actual ID
    // Users can find this by going to chrome://extensions and enabling "Developer mode"
    const scenerExtensionIds = [
      'jdbnofccmhefkmjbkkdkfiicjkgofkdh', // Potential Scener ID
      'hijfjccjfijfjccjfijfjccjfijfjccj', // Placeholder
    ];

    // Try to detect via extension resource loading
    scenerExtensionIds.forEach(id => {
      try {
        const img = document.createElement('img');
        img.src = `chrome-extension://${id}/icon.png`;
        img.onload = () => {
          detected = true;
          setScenerInstalled(true);
        };
        img.onerror = () => {
          // Extension not found with this ID
        };
        // Don't append to DOM, just trigger load
        setTimeout(() => img.remove(), 100);
      } catch (e) {
        // Ignore errors
      }
    });

    // Method 4: Try to detect via injected scripts
    const scripts = document.querySelectorAll('script[src*="scener"], script[src*="chrome-extension"]');
    if (scripts.length > 0) {
      detected = true;
    }

    // Method 5: Check for Scener-specific attributes or data
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      if (el.id?.toLowerCase().includes('scener') || 
          el.className?.toString().toLowerCase().includes('scener') ||
          el.getAttribute('data-scener') ||
          el.getAttribute('scener')) {
        detected = true;
        break;
      }
    }

    // Method 6: PostMessage communication attempt
    try {
      window.postMessage({ type: 'SCENER_CHECK', source: 'vibly' }, '*');
      
      const listener = (event) => {
        if (event.data && (
          event.data.type === 'SCENER_RESPONSE' ||
          event.data.source === 'scener' ||
          event.data.scener === true
        )) {
          detected = true;
          setScenerInstalled(true);
          window.removeEventListener('message', listener);
        }
      };
      
      window.addEventListener('message', listener);
      
      // Clean up listener after 2 seconds
      setTimeout(() => {
        window.removeEventListener('message', listener);
        if (detected) {
          setScenerInstalled(true);
        }
      }, 2000);
    } catch (err) {
      console.log("Scener extension check error:", err);
    }

    // Method 7: Try accessing chrome.runtime (if available)
    if (window.chrome && window.chrome.runtime) {
      // Try to send a message to potential Scener extension
      scenerExtensionIds.forEach(id => {
        try {
          window.chrome.runtime.sendMessage(id, { type: 'ping' }, (response) => {
            if (!window.chrome.runtime.lastError) {
              detected = true;
              setScenerInstalled(true);
            }
          });
        } catch (e) {
          // Extension not found or doesn't respond
        }
      });
    }

    // Set the state if detected or manually confirmed
    if (detected || manualConfirm) {
      setScenerInstalled(true);
    }

    return detected || manualConfirm;
  };

  useEffect(() => {
    // Initial check
    checkScenerExtension();

    // Also check periodically (every 3 seconds) in case extension loads after page
    const interval = setInterval(() => {
      if (!scenerInstalled && !manualConfirm) {
        checkScenerExtension();
      }
    }, 3000);

    // Clean up interval
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenerInstalled, manualConfirm]);

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
    
    // Generate Scener-compatible room code (6-8 character alphanumeric)
    const generateRoomCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };
    setScenerRoomCode(generateRoomCode());

    // Load user's taste preferences for content selection
    const loadUserContent = async () => {
      try {
        const tasteRes = await axios.get(`http://localhost:5001/api/taste/${userId}`);
        const taste = tasteRes.data;
        
        // Combine movies and shows for watch party selection
        const content = [
          ...(taste.movies || []).map(item => ({ ...item, contentType: 'movie' })),
          ...(taste.shows || []).map(item => ({ ...item, contentType: 'show' }))
        ];
        setAvailableContent(content);
      } catch (err) {
        console.error("Error loading user content:", err);
      }
    };

    loadUserContent();

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

  // Remove content from preferences
  const removeContent = async (itemToRemove) => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      // Get current preferences
      const tasteRes = await axios.get(`http://localhost:5001/api/taste/${userId}`);
      const taste = tasteRes.data;

      // Remove the item from the appropriate array
      let updatedMovies = taste.movies || [];
      let updatedShows = taste.shows || [];

      if (itemToRemove.contentType === 'movie') {
        updatedMovies = updatedMovies.filter(
          (item) => item.id !== itemToRemove.id
        );
      } else if (itemToRemove.contentType === 'show') {
        updatedShows = updatedShows.filter(
          (item) => item.id !== itemToRemove.id
        );
      }

      // Save updated preferences
      await axios.post("http://localhost:5001/api/user/preferences", {
        userId,
        movies: updatedMovies,
        shows: updatedShows,
        music: taste.music || [],
      });

      // Update local state
      setAvailableContent((prev) =>
        prev.filter((item) => item.id !== itemToRemove.id)
      );

      // If the removed item was selected, clear selection
      if (selectedContent && selectedContent.id === itemToRemove.id) {
        setSelectedContent(null);
      }

      alert(`${itemToRemove.title || itemToRemove.name} removed from your preferences!`);
    } catch (err) {
      console.error("Error removing content:", err);
      alert("Failed to remove content. Please try again.");
    }
  };

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

  const openScenerGuide = () => {
    setShowScenerGuide(true);
  };

  const refreshScenerCheck = () => {
    setScenerInstalled(false);
    setManualConfirm(false);
    setTimeout(() => {
      checkScenerExtension();
    }, 100);
  };

  const confirmScenerInstalled = () => {
    setManualConfirm(true);
    setScenerInstalled(true);
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(scenerRoomCode);
    alert(`Room code ${scenerRoomCode} copied to clipboard!`);
  };

  const openStreamingService = (service) => {
    const services = {
      netflix: 'https://www.netflix.com',
      hulu: 'https://www.hulu.com',
      disney: 'https://www.disneyplus.com',
      hbomax: 'https://www.hbomax.com',
      prime: 'https://www.amazon.com/Prime-Video'
    };
    
    if (services[service]) {
      window.open(services[service], '_blank');
    }
  };

  // ✅ Launch Scener directly with your generated room code
  const launchScenerParty = () => {
    if (scenerInstalled && scenerRoomCode) {
      // Redirect user to Scener join URL
      window.open(`https://www.scener.com/join/${scenerRoomCode}`, "_blank");
    } else {
      alert("Please install the Scener extension first!");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">🎬 Watch Party</h1>
          {scenerInstalled && (
            <span className="bg-green-600 px-3 py-1 rounded-full text-xs font-semibold">
              ✓ Scener Ready
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!scenerInstalled && (
            <>
              <button
                onClick={refreshScenerCheck}
                className="bg-gray-700 px-3 py-2 rounded hover:bg-gray-600 text-sm"
                title="Refresh Scener detection"
              >
                🔄 Refresh
              </button>
              <button
                onClick={openScenerGuide}
                className="bg-purple-600 px-4 py-2 rounded hover:bg-purple-700 text-sm"
              >
                📦 Setup Scener
              </button>
            </>
          )}
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white"
          >
            ← Back
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Video/Content Area */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* Scener Setup Guide Modal */}
          {showScenerGuide && (
            <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-lg p-8 max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">📦 Setup Scener Extension</h2>
                  <button
                    onClick={() => setShowScenerGuide(false)}
                    className="text-gray-400 hover:text-white text-2xl"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Step 1: Install Scener Extension</h3>
                    <p className="text-gray-400 mb-3">
                      Scener is a browser extension that enables synchronized video watching across Netflix, Hulu, Disney+, HBO Max, and more.
                    </p>
                    <a
                      href="https://scener.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-purple-600 px-4 py-2 rounded hover:bg-purple-700"
                    >
                      Install Scener Extension →
                    </a>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Step 2: Create a Watch Party</h3>
                    <p className="text-gray-400 mb-3">
                      Once installed, open your streaming service and use Scener to create a watch party.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => openStreamingService('netflix')}
                        className="bg-red-600 px-3 py-2 rounded hover:bg-red-700 text-sm"
                      >
                        Open Netflix
                      </button>
                      <button
                        onClick={() => openStreamingService('hulu')}
                        className="bg-green-600 px-3 py-2 rounded hover:bg-green-700 text-sm"
                      >
                        Open Hulu
                      </button>
                      <button
                        onClick={() => openStreamingService('disney')}
                        className="bg-blue-600 px-3 py-2 rounded hover:bg-blue-700 text-sm"
                      >
                        Open Disney+
                      </button>
                      <button
                        onClick={() => openStreamingService('hbomax')}
                        className="bg-purple-600 px-3 py-2 rounded hover:bg-purple-700 text-sm"
                      >
                        Open HBO Max
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Step 3: Share Room Code</h3>
                    <p className="text-gray-400 mb-3">
                      Share this room code with your watch party partner so they can join:
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="bg-gray-700 px-4 py-3 rounded text-2xl font-mono font-bold">
                        {scenerRoomCode}
                      </div>
                      <button
                        onClick={copyRoomCode}
                        className="bg-blue-600 px-4 py-3 rounded hover:bg-blue-700"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content Selection */}
          {!selectedContent ? (
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Select Content to Watch</h2>
              
              {availableContent.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                  {availableContent.slice(0, 8).map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform relative group"
                    >
                      <div onClick={() => setSelectedContent(item)}>
                        {item.posterPath && (
                          <img
                            src={item.posterPath}
                            alt={item.title || item.name}
                            className="w-full h-48 object-cover"
                          />
                        )}
                        <div className="p-3">
                          <h3 className="font-semibold text-sm truncate">
                            {item.title || item.name}
                          </h3>
                          <p className="text-xs text-gray-400 capitalize">{item.contentType}</p>
                        </div>
                      </div>
                      {/* Remove Button - Always Visible */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Remove "${item.title || item.name}" from your preferences?`)) {
                            removeContent(item);
                          }
                        }}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold transition-all z-10 shadow-lg hover:scale-110"
                        title="Remove from preferences"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 mb-4">No content available. Add preferences first!</p>
              )}

              <button
                onClick={() => navigate("/preferences")}
                className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
              >
                {availableContent.length === 0 ? "Add Preferences" : "Browse More Content"}
              </button>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">
                    {selectedContent.title || selectedContent.name}
                  </h2>
                  <p className="text-gray-400 capitalize mb-4">{selectedContent.contentType}</p>
                </div>
                <button
                  onClick={() => setSelectedContent(null)}
                  className="text-gray-400 hover:text-white"
                >
                  Change
                </button>
              </div>

              {selectedContent.posterPath && (
                <img
                  src={selectedContent.posterPath}
                  alt={selectedContent.title || selectedContent.name}
                  className="w-full max-w-md rounded-lg mb-6"
                />
              )}

              {/* Scener Integration Section */}
              <div className="bg-gray-700 rounded-lg p-6 mb-4">
                <h3 className="text-lg font-semibold mb-4">🎬 Start Watch Party with Scener</h3>
                
                {scenerInstalled ? (
                  <div className="space-y-4">
                    <div className="bg-green-900/30 border border-green-600 rounded p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-green-400 font-semibold mb-2">✓ Scener Extension Detected</p>
                          <p className="text-sm text-gray-300">
                            You're all set! Open your streaming service and use Scener to start a synchronized watch party.
                          </p>
                        </div>
                        <button
                          onClick={refreshScenerCheck}
                          className="text-green-400 hover:text-green-300 text-sm ml-2"
                          title="Refresh detection"
                        >
                          🔄
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-400 mb-2">Share this room code with your partner:</p>
                      <div className="flex items-center gap-2">
                        <div className="bg-gray-800 px-4 py-2 rounded text-xl font-mono font-bold">
                          {scenerRoomCode}
                        </div>
                        <button
                          onClick={copyRoomCode}
                          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 text-sm"
                        >
                          Copy Code
                        </button>
                      </div>
                    </div>

                    <div className="mt-4">
                      <button
                        onClick={launchScenerParty}
                        className="bg-purple-600 px-4 py-3 rounded hover:bg-purple-700 text-sm font-semibold"
                      >
                        🎬 Launch Scener Watch Party
                      </button>
                      <p className="text-xs text-gray-400 mt-2">
                        Opens in a new tab using your Scener extension.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => openStreamingService('netflix')}
                        className="bg-red-600 px-4 py-2 rounded hover:bg-red-700 text-sm"
                      >
                        Open Netflix
                      </button>
                      <button
                        onClick={() => openStreamingService('hulu')}
                        className="bg-green-600 px-4 py-2 rounded hover:bg-green-700 text-sm"
                      >
                        Open Hulu
                      </button>
                      <button
                        onClick={() => openStreamingService('disney')}
                        className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 text-sm"
                      >
                        Open Disney+
                      </button>
                      <button
                        onClick={() => openStreamingService('hbomax')}
                        className="bg-purple-600 px-4 py-2 rounded hover:bg-purple-700 text-sm"
                      >
                        Open HBO Max
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-yellow-900/30 border border-yellow-600 rounded p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="text-yellow-400 font-semibold mb-2">⚠️ Scener Extension Not Detected</p>
                          <p className="text-sm text-gray-300 mb-3">
                            Install the Scener browser extension to enable synchronized video watching.
                            If you've already installed it, try refreshing the detection.
                          </p>
                        </div>
                        <button
                          onClick={refreshScenerCheck}
                          className="text-yellow-400 hover:text-yellow-300 text-sm ml-2"
                          title="Refresh detection"
                        >
                          🔄
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href="https://scener.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block bg-purple-600 px-4 py-2 rounded hover:bg-purple-700 text-sm"
                        >
                          Install Scener Extension →
                        </a>
                        <button
                          onClick={refreshScenerCheck}
                          className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600 text-sm"
                        >
                          🔄 Refresh Detection
                        </button>
                        <button
                          onClick={confirmScenerInstalled}
                          className="bg-green-700 px-4 py-2 rounded hover:bg-green-600 text-sm"
                        >
                          ✓ I Have Scener Installed
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-400 mb-2">Room code (share after installing Scener):</p>
                      <div className="flex items-center gap-2">
                        <div className="bg-gray-900 px-4 py-2 rounded text-xl font-mono font-bold text-gray-500">
                          {scenerRoomCode}
                        </div>
                        <button
                          onClick={copyRoomCode}
                          className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600 text-sm"
                        >
                          Copy Code
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {selectedContent.overview && (
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Overview</h3>
                  <p className="text-sm text-gray-300">{selectedContent.overview}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat Sidebar */}
        <div className="w-80 border-l border-gray-700 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 mt-8">
                <p className="text-sm">No messages yet. Start chatting!</p>
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
                      className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
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
          </div>

          <div className="p-4 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 bg-gray-800 text-white px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendMessage}
                className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 transition text-sm"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WatchParty;

