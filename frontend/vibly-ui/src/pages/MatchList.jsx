import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import TinderCard from "../components/TinderCard";

function MatchList() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matchPreferences, setMatchPreferences] = useState({}); // Store preferences per userId
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedUser, setMatchedUser] = useState(null);
  const [currentUserName, setCurrentUserName] = useState("");
  const [showLikeSentModal, setShowLikeSentModal] = useState(false);
  const [likedUserName, setLikedUserName] = useState("");

  // Debug: Log when currentIndex changes
  useEffect(() => {
    console.log(`Current index changed to: ${currentIndex}, match: ${matches[currentIndex]?.name || 'none'}`);
  }, [currentIndex, matches]);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const userId = localStorage.getItem("userId");

        if (!userId) {
          console.error("User ID not found in localStorage");
          setLoading(false);
          return;
        }

        console.log("Fetching matches for user:", userId);
        const res = await axios.get(`http://localhost:5001/api/match/${userId}`);
        
        console.log("Matches response:", res.data);
        const matchesList = res.data.matches || [];
        console.log(`Found ${matchesList.length} matches`);
        
        // Remove duplicates based on userId using Map for better performance
        const uniqueMap = new Map();
        matchesList.forEach(match => {
          if (match.userId && !uniqueMap.has(match.userId)) {
            uniqueMap.set(match.userId, match);
          }
        });
        const uniqueMatches = Array.from(uniqueMap.values());
        console.log(`Found ${matchesList.length} matches, ${uniqueMatches.length} unique after deduplication`);
        console.log("Unique match IDs:", uniqueMatches.map(m => m.userId));
        setMatches(uniqueMatches);
        if (uniqueMatches.length > 0) {
          // Fetch preferences for all matches
          uniqueMatches.forEach(match => {
            fetchMatchDetails(match.userId);
          });
          
          // Fetch current user name
          const currentUserId = localStorage.getItem("userId");
          if (currentUserId) {
            axios.get(`http://localhost:5001/api/user/${currentUserId}`)
              .then(res => setCurrentUserName(res.data.name || "You"))
              .catch(err => console.error("Error fetching current user:", err));
          }
        }
      } catch (err) {
        console.error("Error fetching matches:", err);
        console.error("Error details:", err.response?.data);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const fetchMatchDetails = async (userId) => {
    try {
      // Fetch preferences
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
    console.log(`Swiped ${direction} on match ${index}, currentIndex: ${currentIndex}`);
    
    // Make sure we're only processing the current card
    if (index !== currentIndex) {
      console.log(`Ignoring swipe - index ${index} doesn't match currentIndex ${currentIndex}`);
      return;
    }
    
    if (direction === 'right') {
      // Like - send like to backend
      const userId = localStorage.getItem("userId");
      const matchUserId = matches[index].userId;
      
      console.log(`Sending like from ${userId} to ${matchUserId}`);
      
      try {
        const response = await axios.post("http://localhost:5001/api/match-status/like", {
          fromUser: userId,
          toUser: matchUserId
        });
        
        console.log("Like response:", response.data);
        console.log("Response match status:", response.data.match);
        console.log("Response success:", response.data.success);
        
        // Check if it's a mutual match (both users liked each other)
        const isMatch = response.data.match === "confirmed";
        console.log("Is match?", isMatch);
        console.log("Match status:", response.data.match);
        
        if (isMatch) {
          // It's a confirmed match! Both users liked each other
          console.log("🎉 It's a match!", matches[index].name);
          console.log("Setting matched user:", matches[index]);
          
          // Set both states together
          const matchedUserData = { ...matches[index] };
          setMatchedUser(matchedUserData);
          setShowMatchModal(true);
          
          console.log("Match modal state - showMatchModal: true, matchedUser:", matchedUserData.name);
          
          // Don't advance yet - wait for user to close modal
          return;
        } else {
          // Not a match yet - just a like (pending)
          console.log("You liked", matches[index].name, "- waiting for them to like you back");
          
          // Show "like sent" modal
          setLikedUserName(matches[index].name);
          setShowLikeSentModal(true);
          
          // Don't advance yet - wait for user to close modal
          return;
        }
      } catch (err) {
        console.error("Error sending like:", err);
        console.error("Error response:", err.response?.data);
      }
    }
    
    // Move to next match after a short delay
    // Use functional update to get the latest currentIndex
    setTimeout(() => {
      setCurrentIndex(prevIndex => {
        const nextIndex = prevIndex + 1;
        console.log(`Moving from index ${prevIndex} to ${nextIndex}`);
        if (nextIndex < matches.length) {
          return nextIndex;
        } else {
          console.log("No more matches");
          return prevIndex; // Stay at current if no more matches
        }
      });
    }, 300);
  };

  const outOfFrame = (name) => {
    console.log(`${name} left the screen!`);
  };

  const handleLike = async () => {
    if (currentIndex < matches.length) {
      console.log(`HandleLike: currentIndex=${currentIndex}, match=${matches[currentIndex]?.name}`);
      await swiped('right', currentIndex);
    }
  };

  const handlePass = () => {
    if (currentIndex < matches.length) {
      console.log(`HandlePass: currentIndex=${currentIndex}, match=${matches[currentIndex]?.name}`);
      swiped('left', currentIndex);
    }
  };

  const handleCloseMatchModal = () => {
    setShowMatchModal(false);
    setMatchedUser(null);
    // Move to next match after closing modal
    setCurrentIndex(prevIndex => {
      if (prevIndex < matches.length - 1) {
        return prevIndex + 1;
      }
      return prevIndex;
    });
  };

  const handleCloseLikeSentModal = () => {
    setShowLikeSentModal(false);
    setLikedUserName("");
    // Move to next match after closing modal
    setCurrentIndex(prevIndex => {
      if (prevIndex < matches.length - 1) {
        return prevIndex + 1;
      }
      return prevIndex;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-white text-xl bg-[#0f172a]">
        Loading your matches…
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-white bg-[#0f172a]">
        <div className="text-4xl mb-4">💔</div>
        <div className="text-xl">No matches found yet.</div>
        <div className="text-gray-400 mt-2">Try updating your preferences!</div>
      </div>
    );
  }

  if (currentIndex >= matches.length) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-white bg-[#0f172a]">
        <div className="text-4xl mb-4">🎉</div>
        <div className="text-xl">You've seen all matches!</div>
        <div className="text-gray-400 mt-2">Check back later for more matches.</div>
      </div>
    );
  }

  const displayMatch = matches[currentIndex];

  // Debug: Log modal state on every render
  if (showMatchModal || matchedUser) {
    console.log("🔍 Modal Debug - showMatchModal:", showMatchModal, "matchedUser:", matchedUser?.name);
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-4 relative">
      {/* Like Sent Modal - Shows when user likes someone (not a match yet) */}
      {showLikeSentModal && likedUserName && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-[9999] animate-fadeIn"
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
            animation: 'fadeIn 0.3s ease-in'
          }}
          onClick={handleCloseLikeSentModal}
        >
          <div 
            className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl p-12 text-center max-w-lg mx-4 shadow-2xl transform transition-all animate-scaleIn"
            style={{
              animation: 'scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Heart Icon */}
            <div className="relative mb-6">
              <div 
                className="text-9xl animate-pulse"
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.5))',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}
              >
                💚
              </div>
            </div>

            {/* Title */}
            <h2 
              className="text-5xl font-extrabold mb-6 text-white tracking-tight"
              style={{
                textShadow: '0 4px 6px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)',
                letterSpacing: '-0.02em'
              }}
            >
              Nice!
            </h2>

            {/* Message */}
            <p className="text-xl text-white/90 mb-8 font-medium leading-relaxed">
              We've let <span className="font-bold">{likedUserName}</span> know that you would like to connect!
            </p>

            {/* Subtitle */}
            <p className="text-base text-white/80 mb-8">
              If they like you back, you'll both be notified! 🎉
            </p>

            {/* Continue Button */}
            <button
              onClick={handleCloseLikeSentModal}
              className="w-full bg-white text-purple-600 hover:bg-gray-50 px-8 py-4 rounded-full text-lg font-bold shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-3xl"
              style={{
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)'
              }}
            >
              Continue Swiping
            </button>
          </div>

          {/* Add CSS animations */}
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes scaleIn {
              from { 
                transform: scale(0.5);
                opacity: 0;
              }
              to { 
                transform: scale(1);
                opacity: 1;
              }
            }
            @keyframes pulse {
              0%, 100% { 
                transform: scale(1);
                opacity: 1;
              }
              50% { 
                transform: scale(1.1);
                opacity: 0.9;
              }
            }
            .animate-fadeIn {
              animation: fadeIn 0.3s ease-in;
            }
            .animate-scaleIn {
              animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
          `}</style>
        </div>
      )}

      {/* Match Modal - Beautiful Design - Shows when it's a mutual match */}
      {showMatchModal && matchedUser && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-[9999] animate-fadeIn"
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
            animation: 'fadeIn 0.3s ease-in'
          }}
          onClick={handleCloseMatchModal}
        >
          <div 
            className="bg-gradient-to-br from-pink-500 via-red-500 to-pink-600 rounded-3xl p-12 text-center max-w-lg mx-4 shadow-2xl transform transition-all animate-scaleIn"
            style={{
              animation: 'scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Animated Heart Icon */}
            <div className="relative mb-6">
              <div 
                className="text-9xl animate-pulse"
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.5))',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}
              >
                ❤️
              </div>
              {/* Sparkle effects */}
              <div className="absolute top-0 left-1/4 text-4xl animate-ping" style={{ animationDelay: '0.5s' }}>✨</div>
              <div className="absolute top-0 right-1/4 text-4xl animate-ping" style={{ animationDelay: '1s' }}>✨</div>
            </div>

            {/* Title */}
            <h2 
              className="text-6xl font-extrabold mb-8 text-white tracking-tight"
              style={{
                textShadow: '0 4px 6px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)',
                letterSpacing: '-0.02em'
              }}
            >
              Wow, It's a Match!
            </h2>

            {/* Names with Heart */}
            <div className="flex items-center justify-center mb-10 space-x-4">
              {/* Your Name */}
              <div className="flex flex-col items-center">
                <div 
                  className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 mb-2"
                  style={{
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <span className="text-2xl font-bold text-white">
                    {currentUserName || "You"}
                  </span>
                </div>
              </div>

              {/* Heart Icon */}
              <div 
                className="text-6xl animate-bounce"
                style={{
                  animation: 'bounce 1s ease-in-out infinite',
                  filter: 'drop-shadow(0 0 15px rgba(255, 255, 255, 0.8))'
                }}
              >
                ❤️
              </div>

              {/* Matched User Name */}
              <div className="flex flex-col items-center">
                <div 
                  className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 mb-2"
                  style={{
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <span className="text-2xl font-bold text-white">
                    {matchedUser.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Subtitle */}
            <p className="text-xl text-white/90 mb-8 font-medium">
              Start a conversation and see where it goes!
            </p>

            {/* Action Buttons */}
            <div className="space-y-4 mb-6">
              {/* Chat Button */}
              <button
                onClick={() => {
                  handleCloseMatchModal();
                  navigate(`/chat?matchId=${matchedUser.userId}`);
                }}
                className="w-full bg-white text-pink-600 hover:bg-gray-50 px-8 py-4 rounded-full text-lg font-bold shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-3xl flex items-center justify-center gap-2"
                style={{
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                }}
              >
                💬 Chat with them
              </button>

              {/* Jam Session Button */}
              <button
                onClick={() => {
                  handleCloseMatchModal();
                  navigate(`/jam-session?matchId=${matchedUser.userId}`);
                }}
                className="w-full bg-white text-pink-600 hover:bg-gray-50 px-8 py-4 rounded-full text-lg font-bold shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-3xl flex items-center justify-center gap-2"
                style={{
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                }}
              >
                🎵 Start a Jam Session
              </button>

              {/* Watch Party Button */}
              <button
                onClick={() => {
                  handleCloseMatchModal();
                  navigate(`/watch-party?matchId=${matchedUser.userId}`);
                }}
                className="w-full bg-white text-pink-600 hover:bg-gray-50 px-8 py-4 rounded-full text-lg font-bold shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-3xl flex items-center justify-center gap-2"
                style={{
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                }}
              >
                🎬 Start a Watch Party
              </button>
            </div>

            {/* Continue Swiping Button */}
            <button
              onClick={handleCloseMatchModal}
              className="w-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 px-8 py-3 rounded-full text-base font-semibold transition-all duration-300 hover:scale-105"
              style={{
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
              }}
            >
              Continue Swiping
            </button>
          </div>

          {/* Add CSS animations */}
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes scaleIn {
              from { 
                transform: scale(0.5);
                opacity: 0;
              }
              to { 
                transform: scale(1);
                opacity: 1;
              }
            }
            @keyframes pulse {
              0%, 100% { 
                transform: scale(1);
                opacity: 1;
              }
              50% { 
                transform: scale(1.1);
                opacity: 0.9;
              }
            }
            .animate-fadeIn {
              animation: fadeIn 0.3s ease-in;
            }
            .animate-scaleIn {
              animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
          `}</style>
        </div>
      )}

      {/* Match Counter */}
      <div className="text-gray-400 mb-4 text-sm">
        {currentIndex + 1} of {matches.length} {matches[currentIndex] ? `- ${matches[currentIndex].name}` : ''}
      </div>

      {/* Tinder Card */}
      <div className="relative w-full max-w-md" style={{ height: '85vh', maxHeight: '700px' }}>
        {matches.length > 0 && currentIndex < matches.length && matches.map((match, index) => {
          // Only show current card and next 2 cards for smooth transitions
          if (index < currentIndex) return null;
          if (index > currentIndex + 2) return null;
          
          const isCurrent = index === currentIndex;
          
          return (
            <TinderCard
              key={`match-${match.userId}-idx-${index}`}
              onSwipe={(dir) => {
                console.log(`Card ${index} swiped ${dir}, isCurrent: ${isCurrent}, currentIndex: ${currentIndex}`);
                if (isCurrent) {
                  swiped(dir, index);
                }
              }}
              onCardLeftScreen={() => outOfFrame(match.name)}
              preventSwipe={['up', 'down']}
            >
              <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden h-full flex flex-col">
                {/* Profile Picture - Big */}
                <div className="relative h-2/5 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                  {match.imageUrl ? (
                    <img
                      src={match.imageUrl}
                      alt={match.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-8xl text-white opacity-80">
                      {match.name?.charAt(0).toUpperCase() || '👤'}
                    </div>
                  )}
                  
                  {/* Compatibility Score Badge */}
                  <div className="absolute top-4 right-4 bg-blue-600 px-4 py-2 rounded-full font-bold text-sm">
                    {((match.score || 0) * 100).toFixed(0)}% Match
                  </div>
                </div>

                {/* User Details - Fits in remaining space */}
                <div className="flex-1 p-6 flex flex-col min-h-0">
                  <h2 className="text-2xl font-bold mb-1">{match.name}</h2>
                  <p className="text-gray-400 mb-3 text-sm">{match.email}</p>

                  {/* Preferences - Scrollable if needed, but try to fit */}
                  {matchPreferences[match.userId] && (
                    <div className="space-y-2 flex-1 overflow-y-auto pr-2 min-h-0">
                      {/* Movies */}
                      {matchPreferences[match.userId].movies && matchPreferences[match.userId].movies.length > 0 && (
                        <div>
                          <h3 className="text-base font-semibold mb-2 text-blue-400">🎬 Movies</h3>
                          <div className="flex flex-wrap gap-2">
                            {matchPreferences[match.userId].movies.slice(0, 4).map((movie, idx) => (
                              <span
                                key={idx}
                                className="bg-gray-700 px-2 py-1 rounded-full text-xs"
                              >
                                {typeof movie === 'object' ? movie.title || movie.name : movie}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Music */}
                      {matchPreferences[match.userId].music && matchPreferences[match.userId].music.length > 0 && (
                        <div>
                          <h3 className="text-base font-semibold mb-2 text-pink-400">🎵 Music</h3>
                          <div className="flex flex-wrap gap-2">
                            {matchPreferences[match.userId].music.slice(0, 4).map((artist, idx) => (
                              <span
                                key={idx}
                                className="bg-gray-700 px-2 py-1 rounded-full text-xs"
                              >
                                {typeof artist === 'object' ? artist.name || artist.title : artist}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* TV Shows */}
                      {matchPreferences[match.userId].shows && matchPreferences[match.userId].shows.length > 0 && (
                        <div>
                          <h3 className="text-base font-semibold mb-2 text-green-400">📺 TV Shows</h3>
                          <div className="flex flex-wrap gap-2">
                            {matchPreferences[match.userId].shows.slice(0, 4).map((show, idx) => (
                              <span
                                key={idx}
                                className="bg-gray-700 px-2 py-1 rounded-full text-xs"
                              >
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

export default MatchList;
