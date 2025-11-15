import React, { useState, useEffect } from "react";
import TasteSelector from "../components/TasteSelector";
import GeminiLoading from "../components/GeminiLoading";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

function Preferences() {
  const [movies, setMovies] = useState([]);
  const [tv, setTv] = useState([]);
  const [music, setMusic] = useState([]);
  const [activeTab, setActiveTab] = useState("movies");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const checkForMatches = async (userId, minWaitTime = 8000, maxAttempts = 30, delay = 2000) => {
    const startTime = Date.now();
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const res = await axios.get(`http://localhost:5001/api/match/${userId}`);
        const matches = res.data.matches || [];
        
        const elapsed = Date.now() - startTime;
        
        // Wait at least minWaitTime (8 seconds) to show the loading screen
        // Then check if we have matches or enough attempts
        if (elapsed >= minWaitTime && (matches.length > 0 || attempt >= 10)) {
          return true;
        }
        
        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (err) {
        console.error("Error checking matches:", err);
        // Continue trying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    return true; // Proceed anyway after max attempts
  };

  // Load existing preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
          setIsLoadingPreferences(false);
          return;
        }

        const res = await axios.get(`http://localhost:5001/api/taste/${userId}`);
        if (res.data) {
          setMovies(res.data.movies || []);
          setTv(res.data.shows || []);
          setMusic(res.data.music || []);
        }
      } catch (err) {
        console.error("Error loading preferences:", err);
        // If no preferences exist, that's okay
      } finally {
        setIsLoadingPreferences(false);
      }
    };

    loadPreferences();
  }, []);

  const handleSubmit = async () => {
    try {
      const userId = localStorage.getItem("userId");
      
      if (!userId) {
        alert("Please login first");
        window.location.href = "/login";
        return;
      }

      // Show Gemini loading screen immediately
      setIsProcessing(true);
      
      // Force a small delay to ensure the loading screen renders before API call
      await new Promise(resolve => setTimeout(resolve, 150));

      // Save preferences
      await axios.post("http://localhost:5001/api/user/preferences", {
        userId,
        movies,
        shows: tv, // Map tv to shows for backend
        music,
      });

      // Wait for Gemini to process (embedding generation and matching)
      // Minimum 8 seconds wait time to show the loading screen properly
      await checkForMatches(userId, 8000, 30, 2000);

      // Navigate to match list
      navigate("/match-list");
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      const errorMessage = err.response?.data?.error || "Error saving preferences";
      alert(errorMessage);
    }
  };

  // Show Gemini loading screen while processing or loading preferences
  if (isProcessing) {
    return <GeminiLoading message="Gemini is finding your matches" />;
  }

  if (isLoadingPreferences) {
    return <GeminiLoading message="Loading your preferences" />;
  }

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
            type="movies"
            selections={movies}
            setSelections={setMovies}
          />
        )}
        {activeTab === "tv" && (
          <TasteSelector
            label="Favorite TV Shows"
            type="tv"
            selections={tv}
            setSelections={setTv}
          />
        )}
        {activeTab === "music" && (
          <TasteSelector
            label="Favorite Artists"
            type="music"
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
