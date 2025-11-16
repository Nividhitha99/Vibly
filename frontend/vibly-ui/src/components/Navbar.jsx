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

  // Don't show navbar on landing, login and signup pages
  if (location.pathname === "/" || location.pathname === "/login" || location.pathname === "/signup") {
    return null;
  }

  // If not logged in and not on login/signup, redirect to login
  if (!userId && location.pathname !== "/login" && location.pathname !== "/signup") {
    return null;
  }

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  // Icon components
  const UserIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  const PaletteIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  );

  const HeartIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );

  const ChatIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );

  const MusicIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  );

  const FilmIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );

  const SettingsIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const LogoutIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <div className="flex items-center justify-between h-18 sm:h-20">
          {/* Logo */}
          <Link 
            to="/profile" 
            className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent hover:scale-110 transition-all duration-300 drop-shadow-lg"
            style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', letterSpacing: '-0.02em' }}
          >
            Vibely
          </Link>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {userId && (
              <div className="mr-1">
                <Notifications />
              </div>
            )}
            <Link
              to="/profile"
              className={`relative px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                isActive("/profile")
                  ? "bg-gradient-to-r from-blue-500/90 to-purple-500/90 text-white shadow-lg shadow-blue-500/30"
                  : "text-white/80 hover:text-white hover:bg-white/5"
              }`}
              style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
            >
              <UserIcon className="w-4 h-4" />
              <span className="relative z-10">Profile</span>
              {isActive("/profile") && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg blur-sm"></div>
              )}
            </Link>
            <Link
              to="/age-preference"
              className={`relative px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                isActive("/preferences") || isActive("/age-preference")
                  ? "bg-gradient-to-r from-green-500/90 to-emerald-500/90 text-white shadow-lg shadow-green-500/30"
                  : "text-white/80 hover:text-white hover:bg-white/5"
              }`}
              style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
            >
              <PaletteIcon className="w-4 h-4" />
              <span className="relative z-10">Preferences</span>
              {(isActive("/preferences") || isActive("/age-preference")) && (
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg blur-sm"></div>
              )}
            </Link>
            <Link
              to="/match-list"
              className={`relative px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                isActive("/match-list") || isActive("/match-profile")
                  ? "bg-gradient-to-r from-pink-500/90 to-rose-500/90 text-white shadow-lg shadow-pink-500/30"
                  : "text-white/80 hover:text-white hover:bg-white/5"
              }`}
              style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
            >
              <HeartIcon className="w-4 h-4" />
              <span className="relative z-10">Matches</span>
              {(isActive("/match-list") || isActive("/match-profile")) && (
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-rose-500/20 rounded-lg blur-sm"></div>
              )}
            </Link>
            <Link
              to="/chat"
              className={`relative px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                isActive("/chat")
                  ? "bg-gradient-to-r from-cyan-500/90 to-blue-500/90 text-white shadow-lg shadow-cyan-500/30"
                  : "text-white/80 hover:text-white hover:bg-white/5"
              }`}
              style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
            >
              <ChatIcon className="w-4 h-4" />
              <span className="relative z-10">Chat</span>
              {isActive("/chat") && (
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg blur-sm"></div>
              )}
            </Link>
            <Link
              to="/watch-party"
              className={`relative px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                isActive("/watch-party")
                  ? "bg-gradient-to-r from-red-500/90 to-pink-500/90 text-white shadow-lg shadow-red-500/30"
                  : "text-white/80 hover:text-white hover:bg-white/5"
              }`}
              style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
            >
              <FilmIcon className="w-4 h-4" />
              <span className="relative z-10">Watch</span>
              {isActive("/watch-party") && (
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-lg blur-sm"></div>
              )}
            </Link>
            {userId && (
              <Link
                to="/match-settings"
                className={`relative px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                  isActive("/match-settings")
                    ? "bg-gradient-to-r from-indigo-500/90 to-purple-500/90 text-white shadow-lg shadow-indigo-500/30"
                    : "text-white/80 hover:text-white hover:bg-white/5"
                }`}
                style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
              >
                <SettingsIcon className="w-4 h-4" />
                {isActive("/match-settings") && (
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg blur-sm"></div>
                )}
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            {userId && (
              <div>
                <Notifications />
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white/80 hover:text-white focus:outline-none p-2 rounded-lg hover:bg-white/10 transition-all duration-300"
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Desktop Logout Button */}
          {userId && (
            <div className="hidden md:block">
              <button
                onClick={handleLogout}
                className="relative px-5 py-2.5 bg-gradient-to-r from-red-500/90 to-pink-500/90 hover:from-red-400 hover:to-pink-400 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30 overflow-hidden group flex items-center gap-2"
                style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
              >
                <LogoutIcon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Logout</span>
                <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-500/20 to-pink-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 pt-4 animate-slideDown" style={{ background: 'transparent' }}>
            <div className="flex flex-col gap-2">
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                  isActive("/profile")
                    ? "bg-gradient-to-r from-blue-500/90 to-purple-500/90 text-white shadow-lg"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
                style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
              >
                <UserIcon className="w-5 h-5" />
                Profile
              </Link>
              <Link
                to="/age-preference"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                  isActive("/preferences") || isActive("/age-preference")
                    ? "bg-gradient-to-r from-green-500/90 to-emerald-500/90 text-white shadow-lg"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
                style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
              >
                <PaletteIcon className="w-5 h-5" />
                Preferences
              </Link>
              <Link
                to="/match-list"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                  isActive("/match-list") || isActive("/match-profile")
                    ? "bg-gradient-to-r from-pink-500/90 to-rose-500/90 text-white shadow-lg"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
                style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
              >
                <HeartIcon className="w-5 h-5" />
                Matches
              </Link>
              <Link
                to="/chat"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                  isActive("/chat")
                    ? "bg-gradient-to-r from-cyan-500/90 to-blue-500/90 text-white shadow-lg"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
                style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
              >
                <ChatIcon className="w-5 h-5" />
                Chat
              </Link>
              <Link
                to="/watch-party"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                  isActive("/watch-party")
                    ? "bg-gradient-to-r from-red-500/90 to-pink-500/90 text-white shadow-lg"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
                style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
              >
                <FilmIcon className="w-5 h-5" />
                Watch Party
              </Link>
              {userId && (
                <>
                  <Link
                    to="/match-settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                      isActive("/match-settings")
                        ? "bg-gradient-to-r from-indigo-500/90 to-purple-500/90 text-white shadow-lg"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                    style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                  >
                    <SettingsIcon className="w-5 h-5" />
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="mt-2 px-4 py-3 bg-gradient-to-r from-red-500/90 to-pink-500/90 hover:from-red-400 hover:to-pink-400 text-white font-semibold rounded-lg transition-all duration-300 text-left shadow-lg flex items-center gap-2"
                    style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                  >
                    <LogoutIcon className="w-5 h-5" />
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Custom Animations */}
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
    </nav>
  );
}

export default Navbar;
