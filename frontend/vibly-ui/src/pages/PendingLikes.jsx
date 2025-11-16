import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import TinderCard from "../components/TinderCard";

// Icon components
const HeartIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const XIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ChatIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const MusicIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
  </svg>
);

const FilmIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

function PendingLikes() {
  const navigate = useNavigate();
  const [pendingLikes, setPendingLikes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matchPreferences, setMatchPreferences] = useState({});
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedUser, setMatchedUser] = useState(null);
  const [currentUserName, setCurrentUserName] = useState("");
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
    const fetchPendingLikes = async () => {
      try {
        const userId = localStorage.getItem("userId");

        if (!userId) {
          navigate("/login");
          return;
        }

        // Get all matches where someone liked the current user (pending)
        const res = await axios.get(`http://localhost:5001/api/match-status/${userId}`);
        const allMatches = res.data.matches || [];
        
        // Filter: matches where toUser is current user and status is pending
        const pending = allMatches.filter(
          m => m.toUser === userId && m.status === "pending"
        );

        // Get user details for each pending like
        const pendingWithDetails = await Promise.all(
          pending.map(async (match) => {
            try {
              const userRes = await axios.get(`http://localhost:5001/api/user/${match.fromUser}`);
              return {
                ...userRes.data,
                userId: match.fromUser,
                matchId: match.id || match.fromUser
              };
            } catch (err) {
              console.error("Error fetching user:", err);
              return null;
            }
          })
        );

        const validPending = pendingWithDetails.filter(u => u !== null);
        setPendingLikes(validPending);

        // Fetch preferences for all pending likes
        validPending.forEach(pending => {
          fetchMatchDetails(pending.userId);
        });

        // Fetch current user name
        const currentUserRes = await axios.get(`http://localhost:5001/api/user/${userId}`);
        setCurrentUserName(currentUserRes.data.name || "You");

      } catch (err) {
        console.error("Error fetching pending likes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingLikes();
  }, [navigate]);

  const fetchMatchDetails = async (userId) => {
    try {
      const prefRes = await axios.get(`http://localhost:5001/api/taste/${userId}`);
      setMatchPreferences(prev => ({
        ...prev,
        [userId]: prefRes.data
      }));
    } catch (err) {
      console.error("Error fetching match preferences:", err);
    }
  };

  const swiped = async (direction, index) => {
    if (index !== currentIndex) return;

    if (direction === 'right') {
      // Like back - send like to backend
      const userId = localStorage.getItem("userId");
      const matchUserId = pendingLikes[index].userId;

      try {
        const response = await axios.post("http://localhost:5001/api/match-status/like", {
          fromUser: userId,
          toUser: matchUserId
        });

        const isMatch = response.data.match === "confirmed";

        if (isMatch) {
          // It's a match!
          setMatchedUser({ ...pendingLikes[index] });
          setShowMatchModal(true);
          return;
        }
      } catch (err) {
        console.error("Error sending like:", err);
      }
    }

    // Move to next
    setTimeout(() => {
      setCurrentIndex(prevIndex => {
        if (prevIndex < pendingLikes.length - 1) {
          return prevIndex + 1;
        }
        return prevIndex;
      });
    }, 300);
  };

  const handleLike = async () => {
    if (currentIndex < pendingLikes.length) {
      await swiped('right', currentIndex);
    }
  };

  const handlePass = () => {
    if (currentIndex < pendingLikes.length) {
      swiped('left', currentIndex);
    }
  };

  const handleCloseMatchModal = () => {
    setShowMatchModal(false);
    setMatchedUser(null);
    setCurrentIndex(prevIndex => {
      if (prevIndex < pendingLikes.length - 1) {
        return prevIndex + 1;
      }
      return prevIndex;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex justify-center items-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-white mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-white text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  if (pendingLikes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden flex flex-col justify-center items-center">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-96 h-96 bg-blue-500 rounded-full opacity-10 blur-3xl animate-pulse" style={{ top: '20%', left: '20%' }}></div>
          <div className="absolute w-96 h-96 bg-purple-500 rounded-full opacity-10 blur-3xl animate-pulse" style={{ bottom: '20%', right: '20%', animationDelay: '1s' }}></div>
        </div>
        <div className="relative z-10 text-center">
          <div className="text-6xl mb-6">💔</div>
          <h2 className="text-3xl font-bold text-white mb-2">No pending likes yet</h2>
          <p className="text-white/70 text-lg">Check back later!</p>
        </div>
      </div>
    );
  }

  if (currentIndex >= pendingLikes.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden flex flex-col justify-center items-center">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-96 h-96 bg-blue-500 rounded-full opacity-10 blur-3xl animate-pulse" style={{ top: '20%', left: '20%' }}></div>
          <div className="absolute w-96 h-96 bg-purple-500 rounded-full opacity-10 blur-3xl animate-pulse" style={{ bottom: '20%', right: '20%', animationDelay: '1s' }}></div>
        </div>
        <div className="relative z-10 text-center">
          <div className="text-6xl mb-6">🎉</div>
          <h2 className="text-3xl font-bold text-white mb-2">You've seen all pending likes!</h2>
        </div>
      </div>
    );
  }

  const displayMatch = pendingLikes[currentIndex];

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

      {/* Match Modal */}
      {showMatchModal && matchedUser && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fadeIn"
          onClick={handleCloseMatchModal}
        >
          <div 
            className="relative bg-gradient-to-br from-pink-500 via-red-500 to-pink-600 rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-red-500 rounded-3xl blur-2xl opacity-50"></div>
            
            <div className="relative z-10">
              <div className="text-8xl mb-6 animate-bounce">❤️</div>
              <h2 className="text-5xl sm:text-6xl font-extrabold mb-8 text-white">Wow, It's a Match!</h2>
              <div className="flex items-center justify-center mb-10 space-x-4 flex-wrap">
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 border border-white/30">
                  <span className="text-2xl font-bold text-white">{currentUserName || "You"}</span>
                </div>
                <div className="text-6xl">❤️</div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 border border-white/30">
                  <span className="text-2xl font-bold text-white">{matchedUser.name}</span>
                </div>
              </div>
              <p className="text-xl text-white/90 mb-8">Start a conversation and see where it goes!</p>
              <div className="space-y-4 mb-6">
                <button
                  onClick={() => {
                    handleCloseMatchModal();
                    navigate(`/chat?matchId=${matchedUser.userId}`);
                  }}
                  className="w-full bg-white text-pink-600 hover:bg-gray-50 px-8 py-4 rounded-full text-lg font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-2"
                >
                  <ChatIcon className="w-6 h-6" />
                  <span>Chat with them</span>
                </button>
                <button
                  onClick={() => {
                    handleCloseMatchModal();
                    navigate(`/jam-session?matchId=${matchedUser.userId}`);
                  }}
                  className="w-full bg-white text-pink-600 hover:bg-gray-50 px-8 py-4 rounded-full text-lg font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-2"
                >
                  <MusicIcon className="w-6 h-6" />
                  <span>Start a Jam Session</span>
                </button>
                <button
                  onClick={() => {
                    handleCloseMatchModal();
                    navigate(`/watch-party?matchId=${matchedUser.userId}`);
                  }}
                  className="w-full bg-white text-pink-600 hover:bg-gray-50 px-8 py-4 rounded-full text-lg font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-2"
                >
                  <FilmIcon className="w-6 h-6" />
                  <span>Start a Watch Party</span>
                </button>
              </div>
              <button
                onClick={handleCloseMatchModal}
                className="w-full bg-white/20 hover:bg-white/30 text-white px-8 py-3 rounded-full transition-all duration-300 backdrop-blur-sm border border-white/30"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 pt-24">
        <div className="text-white/80 mb-4 text-sm font-semibold bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
          {currentIndex + 1} of {pendingLikes.length} - {displayMatch?.name}
        </div>

        <div className="relative w-full max-w-md" style={{ height: '85vh', maxHeight: '700px' }}>
          {pendingLikes.map((match, index) => {
            if (index < currentIndex) return null;
            if (index > currentIndex + 2) return null;

            const isCurrent = index === currentIndex;

            return (
              <TinderCard
                key={`pending-${match.userId}-idx-${index}`}
                onSwipe={(dir) => {
                  if (isCurrent) {
                    swiped(dir, index);
                  }
                }}
                onCardLeftScreen={() => {}}
                preventSwipe={['up', 'down']}
              >
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden h-full flex flex-col">
                  <div className="relative h-2/5 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                    {match.profileImages && Array.isArray(match.profileImages) && match.profileImages.length > 0 ? (
                      <div className="w-full h-full flex gap-1">
                        {match.profileImages.slice(0, 2).map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`${match.name} - Image ${idx + 1}`}
                            className={`h-full object-cover ${match.profileImages.length === 1 ? 'w-full' : 'w-1/2'}`}
                          />
                        ))}
                      </div>
                    ) : match.imageUrl ? (
                      <img src={match.imageUrl} alt={match.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-8xl text-white opacity-80">
                        {match.name?.charAt(0).toUpperCase() || '👤'}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 p-6 flex flex-col min-h-0">
                    <h2 className="text-2xl font-bold mb-1 text-white">{match.name}</h2>
                    <p className="text-white/60 mb-3 text-sm">{match.email}</p>
                    <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl px-4 py-2 mb-4 backdrop-blur-sm">
                      <p className="text-green-200 text-sm font-semibold flex items-center gap-2">
                        <HeartIcon className="w-4 h-4" />
                        They want to connect with you!
                      </p>
                    </div>

                    {matchPreferences[match.userId] && (
                      <div className="space-y-3 flex-1 overflow-y-auto pr-2 min-h-0">
                        {matchPreferences[match.userId].movies && matchPreferences[match.userId].movies.length > 0 && (
                          <div>
                            <h3 className="text-base font-semibold mb-2 text-blue-300 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                              </svg>
                              Movies
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {matchPreferences[match.userId].movies.slice(0, 4).map((movie, idx) => (
                                <span key={idx} className="bg-blue-500/20 border border-blue-500/30 px-3 py-1 rounded-full text-xs text-blue-200 backdrop-blur-sm">
                                  {typeof movie === 'object' ? movie.title || movie.name : movie}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {matchPreferences[match.userId].music && matchPreferences[match.userId].music.length > 0 && (
                          <div>
                            <h3 className="text-base font-semibold mb-2 text-purple-300 flex items-center gap-2">
                              <MusicIcon className="w-4 h-4" />
                              Music
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {matchPreferences[match.userId].music.slice(0, 4).map((artist, idx) => (
                                <span key={idx} className="bg-purple-500/20 border border-purple-500/30 px-3 py-1 rounded-full text-xs text-purple-200 backdrop-blur-sm">
                                  {typeof artist === 'object' ? artist.name || artist.title : artist}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {matchPreferences[match.userId].shows && matchPreferences[match.userId].shows.length > 0 && (
                          <div>
                            <h3 className="text-base font-semibold mb-2 text-pink-300 flex items-center gap-2">
                              <FilmIcon className="w-4 h-4" />
                              TV Shows
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {matchPreferences[match.userId].shows.slice(0, 4).map((show, idx) => (
                                <span key={idx} className="bg-pink-500/20 border border-pink-500/30 px-3 py-1 rounded-full text-xs text-pink-200 backdrop-blur-sm">
                                  {typeof show === 'object' ? show.title || show.name : show}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </TinderCard>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-8 mt-8">
          <button
            onClick={handlePass}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 flex items-center justify-center text-white shadow-lg transition-all duration-300 transform hover:scale-110 active:scale-95"
          >
            <XIcon className="w-8 h-8" />
          </button>
          <button
            onClick={handleLike}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 flex items-center justify-center text-white shadow-lg transition-all duration-300 transform hover:scale-110 active:scale-95"
          >
            <HeartIcon className="w-8 h-8" />
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
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default PendingLikes;
