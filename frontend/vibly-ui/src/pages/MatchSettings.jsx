import React, { useState, useEffect } from "react";
import axios from "axios";

function MatchSettings() {
  const [settings, setSettings] = useState({
    minAge: 18,
    maxAge: 100,
    preferredGenders: [],
    minScore: 0,
    maxDailyMatches: 50,
    weights: {
      movies: 0.4,
      music: 0.4,
      shows: 0.2
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
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
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      const res = await axios.get(`http://localhost:5001/api/match-settings/${userId}`);
      if (res.data.success) {
        setSettings(res.data.settings);
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      await axios.put(`http://localhost:5001/api/match-settings/${userId}`, settings);
      setMessage("Settings saved successfully! 🎉");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Error saving settings:", err);
      setMessage("Error saving settings");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex justify-center items-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-white mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-white text-xl">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
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

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2" style={{ lineHeight: '1.2' }}>
            Match Preferences
          </h1>
          <p className="text-white/70 text-lg">Customize your matching experience</p>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl backdrop-blur-sm ${
            message.includes("Error") 
              ? "bg-red-500/20 border border-red-500/50 text-red-200" 
              : "bg-green-500/20 border border-green-500/50 text-green-200"
          }`}>
            <div className="flex items-center gap-2">
              <span>{message.includes("Error") ? "⚠️" : "✅"}</span>
              <span>{message}</span>
            </div>
          </div>
        )}

        {/* Age Range Card */}
        <div className="relative mb-6">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-20"></div>
          <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Age Range
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2">Minimum Age</label>
                <input
                  type="number"
                  min="18"
                  max="100"
                  value={settings.minAge}
                  onChange={(e) => setSettings({ ...settings, minAge: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 text-white border border-white/20 focus:border-purple-400 focus:bg-white/10 focus:ring-2 focus:ring-purple-400/30 focus:outline-none transition-all duration-300"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2">Maximum Age</label>
                <input
                  type="number"
                  min="18"
                  max="100"
                  value={settings.maxAge}
                  onChange={(e) => setSettings({ ...settings, maxAge: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 text-white border border-white/20 focus:border-purple-400 focus:bg-white/10 focus:ring-2 focus:ring-purple-400/30 focus:outline-none transition-all duration-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Gender Preferences Card */}
        <div className="relative mb-6">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-20"></div>
          <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Gender Preferences
            </h2>
            <div className="space-y-3">
              {["Male", "Female", "Other", "Non-binary"].map((gender) => (
                <label key={gender} className="flex items-center space-x-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={settings.preferredGenders.includes(gender)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSettings({
                            ...settings,
                            preferredGenders: [...settings.preferredGenders, gender]
                          });
                        } else {
                          setSettings({
                            ...settings,
                            preferredGenders: settings.preferredGenders.filter(g => g !== gender)
                          });
                        }
                      }}
                      className="w-5 h-5 rounded bg-white/5 border-2 border-white/20 text-purple-500 focus:ring-2 focus:ring-purple-400/30 focus:ring-offset-0 cursor-pointer transition-all duration-300"
                    />
                  </div>
                  <span className="text-white/90 group-hover:text-white transition-colors duration-200">{gender}</span>
                </label>
              ))}
              <p className="text-sm text-white/60 mt-4">
                Leave empty to see all genders
              </p>
            </div>
          </div>
        </div>

        {/* Preference Weights Card */}
        <div className="relative mb-6">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-20"></div>
          <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Preference Importance
            </h2>
            <p className="text-sm text-white/70 mb-6">
              Adjust how much each preference type matters in matching
            </p>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-white/90">Movies</label>
                  <span className="text-purple-300 font-bold">{Math.round(settings.weights.movies * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.weights.movies}
                  onChange={(e) => {
                    const movies = parseFloat(e.target.value);
                    const remaining = 1 - movies;
                    const music = (settings.weights.music / (settings.weights.music + settings.weights.shows)) * remaining;
                    const shows = remaining - music;
                    setSettings({
                      ...settings,
                      weights: { movies, music, shows }
                    });
                  }}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-white/90">Music</label>
                  <span className="text-purple-300 font-bold">{Math.round(settings.weights.music * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.weights.music}
                  onChange={(e) => {
                    const music = parseFloat(e.target.value);
                    const remaining = 1 - music;
                    const movies = (settings.weights.movies / (settings.weights.movies + settings.weights.shows)) * remaining;
                    const shows = remaining - movies;
                    setSettings({
                      ...settings,
                      weights: { movies, music, shows }
                    });
                  }}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-white/90">TV Shows</label>
                  <span className="text-purple-300 font-bold">{Math.round(settings.weights.shows * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.weights.shows}
                  onChange={(e) => {
                    const shows = parseFloat(e.target.value);
                    const remaining = 1 - shows;
                    const movies = (settings.weights.movies / (settings.weights.movies + settings.weights.music)) * remaining;
                    const music = remaining - movies;
                    setSettings({
                      ...settings,
                      weights: { movies, music, shows }
                    });
                  }}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Daily Match Limit Card */}
        <div className="relative mb-6">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-20"></div>
          <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Daily Match Limit
            </h2>
            <p className="text-sm text-white/70 mb-4">
              Maximum number of new matches to see per day
            </p>
            <input
              type="number"
              min="1"
              max="100"
              value={settings.maxDailyMatches}
              onChange={(e) => setSettings({ ...settings, maxDailyMatches: parseInt(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 text-white border border-white/20 focus:border-purple-400 focus:bg-white/10 focus:ring-2 focus:ring-purple-400/30 focus:outline-none transition-all duration-300"
            />
          </div>
        </div>

        {/* Minimum Score Card */}
        <div className="relative mb-6">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-20"></div>
          <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              Minimum Compatibility Score
            </h2>
            <p className="text-sm text-white/70 mb-4">
              Only show matches above this score (0.0 to 1.0)
            </p>
            <input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={settings.minScore}
              onChange={(e) => setSettings({ ...settings, minScore: parseFloat(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 text-white border border-white/20 focus:border-purple-400 focus:bg-white/10 focus:ring-2 focus:ring-purple-400/30 focus:outline-none transition-all duration-300"
            />
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full relative overflow-hidden bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-400 hover:via-purple-400 hover:to-pink-400 text-white font-bold py-4 px-6 rounded-xl transition-all duration-500 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-2xl hover:shadow-purple-500/50 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Save Settings</span>
            </>
          )}
        </button>
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
            rgba(139, 92, 246, 0.3) ${settings.weights.movies * 100}%,
            rgba(236, 72, 153, 0.3) ${settings.weights.movies * 100}%,
            rgba(236, 72, 153, 0.3) ${(settings.weights.movies + settings.weights.music) * 100}%,
            rgba(59, 130, 246, 0.3) ${(settings.weights.movies + settings.weights.music) * 100}%,
            rgba(59, 130, 246, 0.3) 100%
          );
        }
      `}</style>
    </div>
  );
}

export default MatchSettings;
