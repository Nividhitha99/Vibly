import React, { useState } from "react";
import TasteSelector from "../components/TasteSelector";
import axios from "axios";

function Preferences() {
  const [movies, setMovies] = useState([]);
  const [tv, setTv] = useState([]);
  const [music, setMusic] = useState([]);
  const [activeTab, setActiveTab] = useState("movies");

  const handleSubmit = async () => {
    try {
      const userId = localStorage.getItem("userId");
      
      if (!userId) {
        alert("Please login first");
        window.location.href = "/login";
        return;
      }

      await axios.post("http://localhost:5000/api/user/preferences", {
        userId,
        movies,
        shows: tv, // Map tv to shows for backend
        music,
      });

      alert("Preferences saved!");
      window.location.href = "/match-list";
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.error || "Error saving preferences";
      alert(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center pt-12 text-white">

      <h1 className="text-4xl font-bold mb-6">Your Preferences</h1>

      {/* TAB BUTTONS */}
      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "movies" ? "bg-blue-600" : "bg-gray-700"
          }`}
          onClick={() => setActiveTab("movies")}
        >
          Movies
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "tv" ? "bg-blue-600" : "bg-gray-700"
          }`}
          onClick={() => setActiveTab("tv")}
        >
          TV Shows
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "music" ? "bg-blue-600" : "bg-gray-700"
          }`}
          onClick={() => setActiveTab("music")}
        >
          Music
        </button>
      </div>

      {/* SELECTORS */}
      <div className="w-full max-w-xl">
        {activeTab === "movies" && (
          <TasteSelector
            label="Favorite Movies"
            selections={movies}
            setSelections={setMovies}
          />
        )}
        {activeTab === "tv" && (
          <TasteSelector
            label="Favorite TV Shows"
            selections={tv}
            setSelections={setTv}
          />
        )}
        {activeTab === "music" && (
          <TasteSelector
            label="Favorite Artists"
            selections={music}
            setSelections={setMusic}
          />
        )}
      </div>

      {/* SUBMIT BTN */}
      <button
        onClick={handleSubmit}
        className="mt-10 bg-blue-600 px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
      >
        Save & Continue →
      </button>

    </div>
  );
}

export default Preferences;
