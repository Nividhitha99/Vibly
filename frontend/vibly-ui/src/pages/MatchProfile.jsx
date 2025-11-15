import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function MatchProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [taste, setTaste] = useState(null);
  const [loading, setLoading] = useState(true);
  const [conversationStarters, setConversationStarters] = useState([]);
  const [loadingStarters, setLoadingStarters] = useState(false);

  useEffect(() => {
    const fetchMatchProfile = async () => {
      try {
        // Get user info
        const userRes = await axios.get(`http://localhost:5001/api/user/${id}`);
        setMatch(userRes.data);

        // Get taste preferences
        const tasteRes = await axios.get(`http://localhost:5001/api/taste/${id}`);
        setTaste(tasteRes.data);
      } catch (err) {
        console.error("Error fetching match profile:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMatchProfile();
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
      <div className="flex justify-center items-center h-screen text-white text-xl">
        Loading profile...
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex justify-center items-center h-screen text-white text-xl">
        Profile not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6">
      <button
        onClick={() => navigate("/match-list")}
        className="mb-4 text-blue-400 hover:text-blue-300"
      >
        ← Back to Matches
      </button>

      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">{match.name}</h1>
          <p className="text-gray-400">{match.email}</p>
        </div>

        {taste && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">Preferences</h2>
            
            {taste.movies && taste.movies.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">Movies</h3>
                <div className="flex flex-wrap gap-2">
                  {taste.movies.map((movie, idx) => (
                    <span
                      key={idx}
                      className="bg-blue-600 px-3 py-1 rounded text-sm"
                    >
                      {typeof movie === "object" ? movie.title || movie.name : movie}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {taste.music && taste.music.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">Music</h3>
                <div className="flex flex-wrap gap-2">
                  {taste.music.map((artist, idx) => (
                    <span
                      key={idx}
                      className="bg-purple-600 px-3 py-1 rounded text-sm"
                    >
                      {typeof artist === "object" ? artist.name || artist.title : artist}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {taste.shows && taste.shows.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">TV Shows</h3>
                <div className="flex flex-wrap gap-2">
                  {taste.shows.map((show, idx) => (
                    <span
                      key={idx}
                      className="bg-green-600 px-3 py-1 rounded text-sm"
                    >
                      {typeof show === "object" ? show.title || show.name : show}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
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

