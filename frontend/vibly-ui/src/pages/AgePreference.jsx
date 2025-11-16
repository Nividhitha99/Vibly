import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function AgePreference() {
  const navigate = useNavigate();
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(45);
  const [maxDistance, setMaxDistance] = useState(30);
  const [user, setUser] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

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

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
          navigate("/login");
          return;
        }

        const res = await axios.get(`http://localhost:5001/api/user/${userId}`);
        setUser(res.data);
        
        // Load saved preferences if they exist
        if (res.data.ageRangeMin) setMinAge(res.data.ageRangeMin);
        if (res.data.ageRangeMax) setMaxAge(res.data.ageRangeMax);
        if (res.data.maxDistance) setMaxDistance(res.data.maxDistance);
      } catch (err) {
        console.error("Error loading user:", err);
      }
    };

    loadUser();
  }, [navigate]);

  const handleContinue = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        navigate("/login");
        return;
      }

      // Save age and distance preferences
      await axios.put(`http://localhost:5001/api/user/${userId}`, {
        ageRangeMin: minAge,
        ageRangeMax: maxAge,
        maxDistance: maxDistance
      });

      // Navigate to preferences
      navigate("/preferences");
    } catch (err) {
      console.error("Error saving preferences:", err);
      alert("Failed to save preferences. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden flex flex-col items-center justify-center p-6">
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

      <div className="relative z-10 w-full max-w-2xl">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-8 text-center bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent" style={{ lineHeight: '1.2' }}>
          Match Preferences
        </h1>
        
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-20"></div>
          <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 space-y-8">
            {/* Age Range */}
            <div>
              <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Age Range
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-white/90 mb-3">
                    Minimum Age: <span className="text-purple-300 font-bold text-lg">{minAge}</span>
                  </label>
                  <input
                    type="range"
                    min="18"
                    max="100"
                    value={minAge}
                    onChange={(e) => {
                      const newMin = parseInt(e.target.value);
                      setMinAge(newMin);
                      if (newMin > maxAge) setMaxAge(newMin);
                    }}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-white/60 mt-1">
                    <span>18</span>
                    <span>100</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-white/90 mb-3">
                    Maximum Age: <span className="text-purple-300 font-bold text-lg">{maxAge}</span>
                  </label>
                  <input
                    type="range"
                    min={minAge}
                    max="100"
                    value={maxAge}
                    onChange={(e) => setMaxAge(parseInt(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-white/60 mt-1">
                    <span>{minAge}</span>
                    <span>100</span>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl p-4 backdrop-blur-sm">
                  <p className="text-sm text-white/90 flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    You'll see matches between ages <span className="font-bold text-white">{minAge}</span> and <span className="font-bold text-white">{maxAge}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Distance */}
            <div>
              <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Maximum Distance
              </h2>
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-white/90 mb-3">
                  Show matches within: <span className="text-purple-300 font-bold text-lg">{maxDistance} miles</span>
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {[10, 20, 30, 50].map((distance) => (
                    <button
                      key={distance}
                      onClick={() => setMaxDistance(distance)}
                      className={`px-4 py-3 rounded-xl font-semibold transition-all duration-300 transform ${
                        maxDistance === distance
                          ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white scale-105 shadow-lg"
                          : "bg-white/10 backdrop-blur-sm text-white/80 hover:bg-white/20 border border-white/20 hover:scale-105"
                      }`}
                    >
                      {distance} mi
                    </button>
                  ))}
                </div>
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl p-4 backdrop-blur-sm">
                  <p className="text-sm text-white/90 flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Matches will be shown within <span className="font-bold text-white">{maxDistance} miles</span> of your location
                  </p>
                </div>
              </div>
            </div>

            {/* Continue Button */}
            <div className="pt-4">
              <button
                onClick={handleContinue}
                className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-400 hover:via-purple-400 hover:to-pink-400 px-6 py-4 rounded-xl text-lg font-bold text-white transition-all duration-500 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-2xl hover:shadow-purple-500/50 flex items-center justify-center gap-2"
              >
                <span>Continue to Preferences</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }
        
        input[type="range"].slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(to right, #8b5cf6, #ec4899);
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(139, 92, 246, 0.5);
        }
        
        input[type="range"].slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(to right, #8b5cf6, #ec4899);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(139, 92, 246, 0.5);
        }
        
        input[type="range"].slider {
          background: linear-gradient(to right, 
            rgba(139, 92, 246, 0.3) 0%, 
            rgba(139, 92, 246, 0.3) ${((minAge - 18) / 82) * 100}%,
            rgba(236, 72, 153, 0.3) ${((minAge - 18) / 82) * 100}%,
            rgba(236, 72, 153, 0.3) ${((maxAge - 18) / 82) * 100}%,
            rgba(59, 130, 246, 0.3) ${((maxAge - 18) / 82) * 100}%,
            rgba(59, 130, 246, 0.3) 100%
          );
        }
      `}</style>
    </div>
  );
}

export default AgePreference;
