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
    }

    setShowDropdown(false);
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
          <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">
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
          <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-xl z-20 max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Mark all as read
                </button>
              )}
            </div>
            <div className="divide-y divide-gray-700">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 cursor-pointer hover:bg-gray-700 transition ${
                      !notification.read ? "bg-gray-750" : ""
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="flex-1">
                        <p className="text-sm text-white">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="ml-2 h-2 w-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Notifications;

