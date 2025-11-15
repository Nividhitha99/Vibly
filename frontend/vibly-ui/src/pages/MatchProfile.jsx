import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function MatchProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [conversationStarters, setConversationStarters] = useState([]);
  const [loadingStarters, setLoadingStarters] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Fetch user details
        const userRes = await axios.get(`http://localhost:5001/api/user/${id}`);
        setUser(userRes.data);

        // Fetch preferences
        const prefRes = await axios.get(`http://localhost:5001/api/taste/${id}`);
        setPreferences(prefRes.data);
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProfile();
    }
  }, [id]);

  const fetchConversationStarters = async () => {
    setLoadingStarters(true);
    try {
      const userId = localStorage.getItem("userId");
      const res = await axios.post("http://localhost:5001/api/ai/starter", {
        userId,
        matchId: id
      });
      setConversationStarters(res.data.starters || []);
    } catch (err) {
      console.error("Error fetching conversation starters:", err);
    } finally {
      setLoadingStarters(false);
    }
  };

  const handleLike = async () => {
    try {
      const userId = localStorage.getItem("userId");
      await axios.post("http://localhost:5001/api/match-status/like", {
        fromUser: userId,
        toUser: id
      });
      alert("Like sent! You'll be notified if they like you back.");
    } catch (err) {
      console.error("Error sending like:", err);
      alert("Failed to send like");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-white text-xl bg-[#0f172a]">
        Loading profile…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen text-white text-xl bg-[#0f172a]">
        User not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Profile Picture - Big */}
      <div className="relative h-96 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
        {user.imageUrl ? (
          <img
            src={user.imageUrl}
            alt={user.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-8xl text-white opacity-80">
            {user.name?.charAt(0).toUpperCase() || '👤'}
          </div>
        )}
      </div>

      {/* User Details */}
      <div className="p-6 max-w-4xl mx-auto">
        <button
          onClick={() => navigate("/match-list")}
          className="mb-4 text-blue-400 hover:text-blue-300"
        >
          ← Back to Matches
        </button>

        <h1 className="text-4xl font-bold mb-2">{user.name}</h1>
        <p className="text-gray-400 mb-6">{user.email}</p>

        {/* Preferences */}
        {preferences && (
          <div className="space-y-6">
            {/* Movies */}
            {preferences.movies && preferences.movies.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-3 text-blue-400">🎬 Favorite Movies</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {preferences.movies.map((movie, idx) => {
                    const movieData = typeof movie === 'object' ? movie : { title: movie };
                    return (
                      <div
                        key={idx}
                        className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition"
                      >
                        {movieData.posterPath && (
                          <img
                            src={movieData.posterPath}
                            alt={movieData.title}
                            className="w-full h-48 object-cover"
                          />
                        )}
                        <div className="p-3">
                          <h3 className="font-semibold text-sm truncate">
                            {movieData.title || movieData.name}
                          </h3>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Music */}
            {preferences.music && preferences.music.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-3 text-pink-400">🎵 Favorite Artists</h2>
                <div className="flex flex-wrap gap-3">
                  {preferences.music.map((artist, idx) => {
                    const artistData = typeof artist === 'object' ? artist : { name: artist };
                    return (
                      <div
                        key={idx}
                        className="bg-gray-800 rounded-lg p-4 flex items-center gap-3 hover:bg-gray-700 transition"
                      >
                        {artistData.imageUrl && (
                          <img
                            src={artistData.imageUrl}
                            alt={artistData.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <h3 className="font-semibold">{artistData.name || artistData.title}</h3>
                          {artistData.genres && (
                            <p className="text-sm text-gray-400">
                              {artistData.genres.slice(0, 3).join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TV Shows */}
            {preferences.shows && preferences.shows.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-3 text-green-400">📺 Favorite TV Shows</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {preferences.shows.map((show, idx) => {
                    const showData = typeof show === 'object' ? show : { title: show };
                    return (
                      <div
                        key={idx}
                        className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition"
                      >
                        {showData.posterPath && (
                          <img
                            src={showData.posterPath}
                            alt={showData.title}
                            className="w-full h-48 object-cover"
                          />
                        )}
                        <div className="p-3">
                          <h3 className="font-semibold text-sm truncate">
                            {showData.title || showData.name}
                          </h3>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {(!preferences || 
          (!preferences.movies?.length && !preferences.music?.length && !preferences.shows?.length)) && (
          <div className="text-center text-gray-400 py-8">
            No preferences added yet.
          </div>
        )}

        {/* Conversation Starters */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 mt-6">
          <h2 className="text-2xl font-semibold mb-4">Conversation Starters</h2>
          {conversationStarters.length === 0 ? (
            <button
              onClick={fetchConversationStarters}
              disabled={loadingStarters}
              className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loadingStarters ? "Generating..." : "Get Conversation Starters"}
            </button>
          ) : (
            <div className="space-y-3">
              {conversationStarters.map((starter, idx) => (
                <div
                  key={idx}
                  className="bg-gray-700 p-4 rounded cursor-pointer hover:bg-gray-600 transition"
                  onClick={() => navigate(`/jam-session?message=${encodeURIComponent(starter)}`)}
                >
                  <p>{starter}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleLike}
            className="bg-pink-600 px-6 py-3 rounded-lg text-lg font-semibold hover:bg-pink-700 transition flex-1"
          >
            ❤️ Like
          </button>
          <button
            onClick={() => navigate(`/jam-session?matchId=${id}`)}
            className="bg-blue-600 px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition flex-1"
          >
            🎵 Start Jam Session
          </button>
          <button
            onClick={() => navigate(`/watch-party?matchId=${id}`)}
            className="bg-green-600 px-6 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition flex-1"
          >
            🎬 Start Watch Party
          </button>
        </div>
      </div>
    </div>
  );
}

export default MatchProfile;


