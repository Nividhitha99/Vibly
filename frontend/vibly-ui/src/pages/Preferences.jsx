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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
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

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
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
      const response = await axios.post("http://localhost:5001/api/user/preferences", {
        userId,
        movies,
        shows: tv, // Map tv to shows for backend
        music,
      });
      
      console.log("[Preferences] Save response:", response.data);
      
      // Check if save was successful
      if (!response.data || response.data.error) {
        throw new Error(response.data?.error || "Failed to save preferences");
      }

      // Wait for Gemini to process (embedding generation and matching)
      // Minimum 8 seconds wait time to show the loading screen properly
      await checkForMatches(userId, 8000, 30, 2000);

      // Navigate to match list with flag to skip mode selection
      navigate("/match-list", { state: { skipModeSelection: true } });
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden flex flex-col items-center pt-12 text-white">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-96 h-96 bg-blue-500 rounded-full opacity-10 blur-3xl animate-pulse"
          style={{
            top: `${mousePosition.y * 0.3}%`,
            left: `${mousePosition.x * 0.3}%`,
            transition: "all 0.3s ease-out",
          }}
        />
        <div
          className="absolute w-96 h-96 bg-purple-500 rounded-full opacity-10 blur-3xl animate-pulse"
          style={{
            top: `${100 - mousePosition.y * 0.3}%`,
            right: `${100 - mousePosition.x * 0.3}%`,
            transition: "all 0.3s ease-out",
            animationDelay: "1s",
          }}
        />
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-4xl px-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-8 text-center bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent" style={{ lineHeight: '1.2' }}>
          Your Preferences
        </h1>

        {/* TAB BUTTONS */}
        <div className="flex gap-4 mb-8 justify-center flex-wrap">
          <button
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 ${
              activeTab === "movies" 
                ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg" 
                : "bg-white/10 backdrop-blur-sm text-white/80 hover:bg-white/20 border border-white/20"
            }`}
            onClick={() => setActiveTab("movies")}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
              Movies
            </span>
          </button>
          <button
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 ${
              activeTab === "tv" 
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg" 
                : "bg-white/10 backdrop-blur-sm text-white/80 hover:bg-white/20 border border-white/20"
            }`}
            onClick={() => setActiveTab("tv")}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              TV Shows
            </span>
          </button>
          <button
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 ${
              activeTab === "music" 
                ? "bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg" 
                : "bg-white/10 backdrop-blur-sm text-white/80 hover:bg-white/20 border border-white/20"
            }`}
            onClick={() => setActiveTab("music")}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              Music
            </span>
          </button>
        </div>

        {/* SELECTORS */}
        <div className="w-full">
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
        <div className="flex justify-center mt-10 mb-8">
          <button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-400 hover:via-purple-400 hover:to-pink-400 px-8 py-4 rounded-xl text-lg font-bold text-white transition-all duration-500 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-2xl hover:shadow-purple-500/50 flex items-center gap-2"
          >
            <span>Save & Continue</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }
      `}</style>
    </div>
  );
}

export default Preferences;
