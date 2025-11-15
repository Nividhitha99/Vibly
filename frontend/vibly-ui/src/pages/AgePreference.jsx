import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function AgePreference() {
  const navigate = useNavigate();
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(45);
  const [maxDistance, setMaxDistance] = useState(30);
  const [user, setUser] = useState(null);

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
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <h1 className="text-4xl font-bold mb-8 text-center">Match Preferences</h1>
        
        <div className="bg-gray-800 rounded-lg p-8 space-y-8">
          {/* Age Range */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Age Range</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Minimum Age: <span className="text-blue-400 font-bold">{minAge}</span>
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
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>18</span>
                  <span>100</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Maximum Age: <span className="text-blue-400 font-bold">{maxAge}</span>
                </label>
                <input
                  type="range"
                  min={minAge}
                  max="100"
                  value={maxAge}
                  onChange={(e) => setMaxAge(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{minAge}</span>
                  <span>100</span>
                </div>
              </div>
              
              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                <p className="text-sm text-blue-300">
                  💡 You'll see matches between ages <span className="font-bold">{minAge}</span> and <span className="font-bold">{maxAge}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Distance */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Maximum Distance</h2>
            <div className="space-y-4">
              <label className="block text-sm font-medium mb-2">
                Show matches within: <span className="text-blue-400 font-bold">{maxDistance} miles</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 20, 30, 50].map((distance) => (
                  <button
                    key={distance}
                    onClick={() => setMaxDistance(distance)}
                    className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                      maxDistance === distance
                        ? "bg-blue-600 text-white scale-105"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {distance} mi
                  </button>
                ))}
              </div>
              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                <p className="text-sm text-blue-300">
                  💡 Matches will be shown within <span className="font-bold">{maxDistance} miles</span> of your location
                </p>
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <div className="pt-4">
            <button
              onClick={handleContinue}
              className="w-full bg-blue-600 hover:bg-blue-700 px-6 py-4 rounded-lg text-lg font-semibold transition"
            >
              Continue to Preferences →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgePreference;

