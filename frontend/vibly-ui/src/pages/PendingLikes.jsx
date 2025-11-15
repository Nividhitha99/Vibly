import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import TinderCard from "../components/TinderCard";

function PendingLikes() {
  const navigate = useNavigate();
  const [pendingLikes, setPendingLikes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matchPreferences, setMatchPreferences] = useState({});
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedUser, setMatchedUser] = useState(null);
  const [currentUserName, setCurrentUserName] = useState("");

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
      <div className="flex justify-center items-center h-screen text-white text-xl bg-[#0f172a]">
        Loading...
      </div>
    );
  }

  if (pendingLikes.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-white bg-[#0f172a]">
        <div className="text-4xl mb-4">💔</div>
        <div className="text-xl">No pending likes yet.</div>
        <div className="text-gray-400 mt-2">Check back later!</div>
      </div>
    );
  }

  if (currentIndex >= pendingLikes.length) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-white bg-[#0f172a]">
        <div className="text-4xl mb-4">🎉</div>
        <div className="text-xl">You've seen all pending likes!</div>
      </div>
    );
  }

  const displayMatch = pendingLikes[currentIndex];

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-4 relative">
      {/* Match Modal - Same as MatchList */}
      {showMatchModal && matchedUser && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-[9999]"
          onClick={handleCloseMatchModal}
        >
          <div 
            className="bg-gradient-to-br from-pink-500 via-red-500 to-pink-600 rounded-3xl p-12 text-center max-w-lg mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-9xl mb-6">❤️</div>
            <h2 className="text-6xl font-extrabold mb-8 text-white">Wow, It's a Match!</h2>
            <div className="flex items-center justify-center mb-10 space-x-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3">
                <span className="text-2xl font-bold text-white">{currentUserName || "You"}</span>
              </div>
              <div className="text-6xl">❤️</div>
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3">
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
                className="w-full bg-white text-pink-600 hover:bg-gray-50 px-8 py-4 rounded-full text-lg font-bold"
              >
                💬 Chat with them
              </button>
              <button
                onClick={() => {
                  handleCloseMatchModal();
                  navigate(`/jam-session?matchId=${matchedUser.userId}`);
                }}
                className="w-full bg-white text-pink-600 hover:bg-gray-50 px-8 py-4 rounded-full text-lg font-bold"
              >
                🎵 Start a Jam Session
              </button>
              <button
                onClick={() => {
                  handleCloseMatchModal();
                  navigate(`/watch-party?matchId=${matchedUser.userId}`);
                }}
                className="w-full bg-white text-pink-600 hover:bg-gray-50 px-8 py-4 rounded-full text-lg font-bold"
              >
                🎬 Start a Watch Party
              </button>
            </div>
            <button
              onClick={handleCloseMatchModal}
              className="w-full bg-white/20 text-white px-8 py-3 rounded-full"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      <div className="text-gray-400 mb-4 text-sm">
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
              <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden h-full flex flex-col">
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
                  <h2 className="text-2xl font-bold mb-1">{match.name}</h2>
                  <p className="text-gray-400 mb-3 text-sm">{match.email}</p>
                  <p className="text-blue-400 mb-4 text-sm font-semibold">
                    💚 They want to connect with you!
                  </p>

                  {matchPreferences[match.userId] && (
                    <div className="space-y-2 flex-1 overflow-y-auto pr-2 min-h-0">
                      {matchPreferences[match.userId].movies && matchPreferences[match.userId].movies.length > 0 && (
                        <div>
                          <h3 className="text-base font-semibold mb-2 text-blue-400">🎬 Movies</h3>
                          <div className="flex flex-wrap gap-2">
                            {matchPreferences[match.userId].movies.slice(0, 4).map((movie, idx) => (
                              <span key={idx} className="bg-gray-700 px-2 py-1 rounded-full text-xs">
                                {typeof movie === 'object' ? movie.title || movie.name : movie}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {matchPreferences[match.userId].music && matchPreferences[match.userId].music.length > 0 && (
                        <div>
                          <h3 className="text-base font-semibold mb-2 text-pink-400">🎵 Music</h3>
                          <div className="flex flex-wrap gap-2">
                            {matchPreferences[match.userId].music.slice(0, 4).map((artist, idx) => (
                              <span key={idx} className="bg-gray-700 px-2 py-1 rounded-full text-xs">
                                {typeof artist === 'object' ? artist.name || artist.title : artist}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {matchPreferences[match.userId].shows && matchPreferences[match.userId].shows.length > 0 && (
                        <div>
                          <h3 className="text-base font-semibold mb-2 text-green-400">📺 TV Shows</h3>
                          <div className="flex flex-wrap gap-2">
                            {matchPreferences[match.userId].shows.slice(0, 4).map((show, idx) => (
                              <span key={idx} className="bg-gray-700 px-2 py-1 rounded-full text-xs">
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

      <div className="flex gap-8 mt-8">
        <button
          onClick={handlePass}
          className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white text-2xl shadow-lg transition-transform hover:scale-110"
        >
          ✕
        </button>
        <button
          onClick={handleLike}
          className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center text-white text-2xl shadow-lg transition-transform hover:scale-110"
        >
          ♥
        </button>
      </div>
    </div>
  );
}

export default PendingLikes;

