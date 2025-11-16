import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";

function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) return;

    // Connect to socket for real-time notifications
    const socket = io("http://localhost:5001", {
      transports: ["websocket"]
    });

    socket.on("connect", () => {
      console.log("✅ Connected to socket for notifications, userId:", userId);
      socket.emit("registerUser", userId);
      console.log("📤 Emitted registerUser for userId:", userId);
    });

    socket.on("notification", (notification) => {
      console.log("🔔 New notification received via socket:", notification);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
    });

    socket.on("disconnect", () => {
      console.log("⚠️ Socket disconnected for notifications");
    });

    // Fetch existing notifications
    const fetchNotifications = async () => {
      try {
        const res = await axios.get(`http://localhost:5001/api/notifications/${userId}`);
        setNotifications(res.data.notifications || []);
        
        const unreadRes = await axios.get(`http://localhost:5001/api/notifications/${userId}/unread-count`);
        setUnreadCount(unreadRes.data.count || 0);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    fetchNotifications();

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  const handleNotificationClick = async (notification) => {
    // Mark as read
    try {
      await axios.put(`http://localhost:5001/api/notifications/${notification.id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }

    // Navigate based on notification type
    if (notification.type === "like") {
      navigate("/pending-likes");
    } else if (notification.type === "watchParty" && notification.actionUrl) {
      // Navigate to watch party using the actionUrl, mark as joining from notification
      const url = notification.actionUrl.includes("?") 
        ? `${notification.actionUrl}&fromNotification=true`
        : `${notification.actionUrl}?fromNotification=true`;
      navigate(url);
    } else if (notification.type === "jam-invite") {
      // Handle jam invite - accept and navigate
      handleAcceptJamInvite(notification);
    }

    setShowDropdown(false);
  };

  const handleAcceptJamInvite = async (notification) => {
    try {
      const res = await axios.post("http://localhost:5001/api/jam/accept", {
        notificationId: notification.id,
        userId: userId
      });
      
      if (res.data.success && res.data.roomId) {
        // Extract matchId from roomId (format: jam-userId1-userId2)
        // UUIDs contain hyphens, so we need to extract them properly
        const roomIdWithoutPrefix = res.data.roomId.replace("jam-", "");
        
        // UUIDs are 36 characters long (including hyphens)
        // Find the position where the first UUID ends (after 36 chars)
        // The second UUID starts after a hyphen following the first UUID
        const uuidPattern = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;
        const matches = roomIdWithoutPrefix.match(uuidPattern);
        
        if (matches && matches.length === 2) {
          // Find the other user ID (not the current user)
          const otherUserId = matches.find(id => id !== userId);
          
          if (otherUserId) {
            console.log("[Notifications] Extracted other user ID:", otherUserId);
            navigate(`/jam-session?matchId=${otherUserId}&accepted=true`);
          } else {
            console.error("[Notifications] Could not find other user ID in room ID");
          }
        } else {
          console.error("[Notifications] Could not parse room ID properly. Expected 2 UUIDs, found:", matches?.length || 0);
        }
      }
    } catch (err) {
      console.error("Error accepting jam invite:", err);
      alert("Failed to accept jam session invite");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.put(`http://localhost:5001/api/notifications/${userId}/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  // Refetch notifications when dropdown opens
  const handleToggleDropdown = async () => {
    const newState = !showDropdown;
    setShowDropdown(newState);
    
    // If opening dropdown, refetch notifications to ensure we have the latest
    if (newState) {
      try {
        const res = await axios.get(`http://localhost:5001/api/notifications/${userId}`);
        setNotifications(res.data.notifications || []);
        
        const unreadRes = await axios.get(`http://localhost:5001/api/notifications/${userId}/unread-count`);
        setUnreadCount(unreadRes.data.count || 0);
        console.log("Notifications refetched:", res.data.notifications?.length || 0, "unread:", unreadRes.data.count || 0);
      } catch (err) {
        console.error("Error refetching notifications:", err);
      }
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleToggleDropdown}
        className="relative p-2 text-gray-300 hover:text-white focus:outline-none"
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-white/80 hover:text-white focus:outline-none rounded-lg hover:bg-white/10 transition-all duration-300"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold flex items-center justify-center shadow-lg animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 z-20 max-h-96 overflow-y-auto animate-slideDown">
            {/* Header */}
            <div className="p-4 border-b border-white/20 flex items-center justify-between bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-t-2xl">
              <h3 className="text-lg font-bold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-purple-300 hover:text-purple-200 font-semibold transition-colors duration-200"
                >
                  Mark all as read
                </button>
              )}
            </div>
            
            {/* Notifications List */}
            <div className="divide-y divide-white/10">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-white/60">
                  <svg className="w-12 h-12 mx-auto mb-3 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 cursor-pointer transition-all duration-300 ${
                      !notification.read 
                        ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border-l-4 border-blue-400" 
                        : "hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 mt-1 ${!notification.read ? 'animate-pulse' : ''}`}>
                        {!notification.read ? (
                          <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                        ) : (
                          <div className="h-2 w-2 bg-white/30 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.read ? 'text-white font-semibold' : 'text-white/80'}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-white/50 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                        {notification.type === "jam-invite" && !notification.read && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcceptJamInvite(notification);
                                setShowDropdown(false);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs font-semibold"
                            >
                              Accept
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotificationClick(notification);
                              }}
                              className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-xs"
                            >
                              Dismiss
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default Notifications;
