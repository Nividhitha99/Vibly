import React from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const handleLogout = () => {
    localStorage.removeItem("userId");
    navigate("/login");
  };

  if (!userId) {
    return null; // Don't show navbar if not logged in
  }

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/match-list" className="text-xl font-bold">
          Vibly
        </Link>
        
        <div className="flex items-center gap-4">
          <Link
            to="/match-list"
            className="hover:text-blue-400 transition"
          >
            Matches
          </Link>
          <Link
            to="/preferences"
            className="hover:text-blue-400 transition"
          >
            Preferences
          </Link>
          <Link
            to="/profile"
            className="hover:text-blue-400 transition"
          >
            Profile
          </Link>
          <button
            onClick={handleLogout}
            className="bg-red-600 px-4 py-2 rounded hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

