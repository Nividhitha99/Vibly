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
      setMessage("Settings saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Error saving settings:", err);
      setMessage("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-900 text-white p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Match Preferences</h1>

        {message && (
          <div className={`mb-4 p-4 rounded-lg ${message.includes("Error") ? "bg-red-500" : "bg-green-500"}`}>
            {message}
          </div>
        )}

        {/* Age Range */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Age Range</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2">Minimum Age</label>
              <input
                type="number"
                min="18"
                max="100"
                value={settings.minAge}
                onChange={(e) => setSettings({ ...settings, minAge: parseInt(e.target.value) })}
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Maximum Age</label>
              <input
                type="number"
                min="18"
                max="100"
                value={settings.maxAge}
                onChange={(e) => setSettings({ ...settings, maxAge: parseInt(e.target.value) })}
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Gender Preferences */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Gender Preferences</h2>
          <div className="space-y-2">
            {["Male", "Female", "Other", "Non-binary"].map((gender) => (
              <label key={gender} className="flex items-center space-x-2 cursor-pointer">
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
                  className="w-4 h-4"
                />
                <span>{gender}</span>
              </label>
            ))}
            <p className="text-sm text-gray-400 mt-2">
              Leave empty to see all genders
            </p>
          </div>
        </div>

        {/* Preference Weights */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Preference Importance</h2>
          <p className="text-sm text-gray-400 mb-4">
            Adjust how much each preference type matters in matching
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2">
                Movies: {Math.round(settings.weights.movies * 100)}%
              </label>
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
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">
                Music: {Math.round(settings.weights.music * 100)}%
              </label>
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
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">
                TV Shows: {Math.round(settings.weights.shows * 100)}%
              </label>
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
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Daily Match Limit */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Daily Match Limit</h2>
          <p className="text-sm text-gray-400 mb-4">
            Maximum number of new matches to see per day
          </p>
          <input
            type="number"
            min="1"
            max="100"
            value={settings.maxDailyMatches}
            onChange={(e) => setSettings({ ...settings, maxDailyMatches: parseInt(e.target.value) })}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg"
          />
        </div>

        {/* Minimum Score */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Minimum Compatibility Score</h2>
          <p className="text-sm text-gray-400 mb-4">
            Only show matches above this score (0.0 to 1.0)
          </p>
          <input
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={settings.minScore}
            onChange={(e) => setSettings({ ...settings, minScore: parseFloat(e.target.value) })}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg"
          />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}

export default MatchSettings;

