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
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex justify-center items-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-white mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-white text-xl">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex justify-center items-center">
        <div className="text-center">
          <div className="text-6xl mb-6">👤</div>
          <h2 className="text-3xl font-bold text-white mb-2">User not found</h2>
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

      {/* Profile Pictures - Big */}
      <div className="relative h-96 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
        {user.profileImages && Array.isArray(user.profileImages) && user.profileImages.length > 0 ? (
          <div className="w-full h-full flex gap-2">
            {user.profileImages.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`${user.name} - Image ${idx + 1}`}
                className={`w-full h-full object-cover ${user.profileImages.length === 1 ? '' : 'w-1/2'}`}
              />
            ))}
          </div>
        ) : user.imageUrl ? (
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
      <div className="relative z-10 p-6 max-w-4xl mx-auto pt-8">
        <button
          onClick={() => navigate("/match-list")}
          className="mb-6 text-white/80 hover:text-white flex items-center gap-2 transition-colors duration-200 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20 hover:bg-white/20"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Matches</span>
        </button>

        <h1 className="text-4xl sm:text-5xl font-extrabold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent" style={{ lineHeight: '1.2' }}>
          {user.name}
        </h1>
        <p className="text-white/70 mb-8 text-lg">{user.email}</p>

        {/* Preferences */}
        {preferences && (
          <div className="space-y-8">
            {/* Movies */}
            {preferences.movies && preferences.movies.length > 0 && (
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-20"></div>
                <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6">
                  <h2 className="text-2xl font-bold mb-4 text-blue-300 flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                    </svg>
                    Favorite Movies
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {preferences.movies.map((movie, idx) => {
                      const movieData = typeof movie === 'object' ? movie : { title: movie };
                      return (
                        <div
                          key={idx}
                          className="bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-white/10 transition-all duration-300 transform hover:scale-105 border border-white/10"
                        >
                          {movieData.posterPath && (
                            <img
                              src={movieData.posterPath}
                              alt={movieData.title}
                              className="w-full h-48 object-cover"
                            />
                          )}
                          <div className="p-3">
                            <h3 className="font-semibold text-sm truncate text-white">
                              {movieData.title || movieData.name}
                            </h3>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Music */}
            {preferences.music && preferences.music.length > 0 && (
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-20"></div>
                <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6">
                  <h2 className="text-2xl font-bold mb-4 text-purple-300 flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    Favorite Artists
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {preferences.music.map((artist, idx) => {
                      const artistData = typeof artist === 'object' ? artist : { name: artist };
                      return (
                        <div
                          key={idx}
                          className="bg-white/5 backdrop-blur-sm rounded-xl p-4 flex items-center gap-3 hover:bg-white/10 transition-all duration-300 transform hover:scale-105 border border-white/10"
                        >
                          {artistData.imageUrl && (
                            <img
                              src={artistData.imageUrl}
                              alt={artistData.name}
                              className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
                            />
                          )}
                          <div>
                            <h3 className="font-semibold text-white">{artistData.name || artistData.title}</h3>
                            {artistData.genres && (
                              <p className="text-sm text-white/60">
                                {artistData.genres.slice(0, 3).join(", ")}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TV Shows */}
            {preferences.shows && preferences.shows.length > 0 && (
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-20"></div>
                <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6">
                  <h2 className="text-2xl font-bold mb-4 text-pink-300 flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Favorite TV Shows
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {preferences.shows.map((show, idx) => {
                      const showData = typeof show === 'object' ? show : { title: show };
                      return (
                        <div
                          key={idx}
                          className="bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-white/10 transition-all duration-300 transform hover:scale-105 border border-white/10"
                        >
                          {showData.posterPath && (
                            <img
                              src={showData.posterPath}
                              alt={showData.title}
                              className="w-full h-48 object-cover"
                            />
                          )}
                          <div className="p-3">
                            <h3 className="font-semibold text-sm truncate text-white">
                              {showData.title || showData.name}
                            </h3>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {(!preferences || 
          (!preferences.movies?.length && !preferences.music?.length && !preferences.shows?.length)) && (
          <div className="text-center text-white/60 py-8 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            No preferences added yet.
          </div>
        )}

        {/* Conversation Starters */}
        <div className="relative mt-8 mb-6">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-20"></div>
          <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6">
            <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Conversation Starters
            </h2>
            {conversationStarters.length === 0 ? (
              <button
                onClick={fetchConversationStarters}
                disabled={loadingStarters}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 px-6 py-3 rounded-xl text-white font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
              >
                {loadingStarters ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Get Conversation Starters</span>
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-3">
                {conversationStarters.map((starter, idx) => (
                  <div
                    key={idx}
                    className="bg-white/5 backdrop-blur-sm p-4 rounded-xl cursor-pointer hover:bg-white/10 transition-all duration-300 transform hover:scale-[1.02] border border-white/10"
                    onClick={() => navigate(`/chat?matchId=${id}&message=${encodeURIComponent(starter)}`)}
                  >
                    <p className="text-white">{starter}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button
            onClick={handleLike}
            className="flex-1 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-400 hover:to-red-400 px-6 py-3 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl text-white flex items-center justify-center gap-2"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>Like</span>
          </button>
          <button
            onClick={() => navigate(`/jam-session?matchId=${id}`)}
            className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 px-6 py-3 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl text-white flex items-center justify-center gap-2"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <span>Start Jam Session</span>
          </button>
          <button
            onClick={() => navigate(`/watch-party?matchId=${id}`)}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 px-6 py-3 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl text-white flex items-center justify-center gap-2"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>Start Watch Party</span>
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

export default MatchProfile;
