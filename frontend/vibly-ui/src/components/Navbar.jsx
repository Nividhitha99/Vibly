import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Notifications from "./Notifications";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = localStorage.getItem("userId");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("userId");
    navigate("/login");
  };

  // Don't show navbar on login and signup pages
  if (location.pathname === "/login" || location.pathname === "/signup") {
    return null;
  }

  // If not logged in and not on login/signup, redirect to login
  if (!userId && location.pathname !== "/login" && location.pathname !== "/signup") {
    return null;
  }

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <nav className="bg-gray-800 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/profile" className="text-2xl font-bold text-blue-400 hover:text-blue-300 transition">
            Vibly
          </Link>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            {userId && <Notifications />}
            <Link
              to="/profile"
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                isActive("/profile")
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              Profile
            </Link>
            <Link
              to="/preferences"
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                isActive("/preferences")
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              Preferences
            </Link>
            <Link
              to="/match-list"
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                isActive("/match-list") || isActive("/match-profile")
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              Matches
            </Link>
            <Link
              to="/watch-party"
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                isActive("/watch-party")
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              Watch Party
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-300 hover:text-white focus:outline-none"
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Logout Button */}
          {userId && (
            <div className="hidden md:block">
              <button
                onClick={handleLogout}
                className="bg-red-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-700 mt-2 pt-4">
            <div className="flex flex-col gap-2">
              {userId && (
                <div className="px-3 py-2">
                  <Notifications />
                </div>
              )}
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive("/profile")
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-700"
                }`}
              >
                Profile
              </Link>
              <Link
                to="/preferences"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive("/preferences")
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-700"
                }`}
              >
                Preferences
              </Link>
              <Link
                to="/match-list"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive("/match-list") || isActive("/match-profile")
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-700"
                }`}
              >
                Matches
              </Link>
              <Link
                to="/watch-party"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive("/watch-party")
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-700"
                }`}
              >
                Watch Party
              </Link>
              {userId && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="mt-2 bg-red-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 text-left"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;

