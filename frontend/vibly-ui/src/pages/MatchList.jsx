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
  
  // Filter states
  const [showFilters, setShowFilters] = useState(true);
  const [filterByAge, setFilterByAge] = useState(true);
  const [filterByLocation, setFilterByLocation] = useState(true);
  const [filteredMatches, setFilteredMatches] = useState([]);

  // Debug: Log when currentIndex changes
  useEffect(() => {
    const displayMatches = showFilters ? matches : filteredMatches;
    console.log(`Current index changed to: ${currentIndex}, match: ${displayMatches[currentIndex]?.name || 'none'}`);
  }, [currentIndex, matches, filteredMatches, showFilters]);

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
        
        // Filter matches by 60% threshold (score >= 0.6)
        const filteredMatches = matchesList.filter(match => {
          const score = match.score || 0;
          return score >= 0.6;
        });
        console.log(`Filtered to ${filteredMatches.length} matches with 60%+ compatibility`);
        
        // Sort by score (high to low) - backend should already do this, but ensure it
        const sortedMatches = filteredMatches.sort((a, b) => {
          const scoreA = a.score || 0;
          const scoreB = b.score || 0;
          return scoreB - scoreA; // High to low
        });
        
        // Remove duplicates based on userId using Map for better performance
        // Also handle cases where userId might be undefined or null
        const uniqueMap = new Map();
        const seenUserIds = new Set();
        
        sortedMatches.forEach(match => {
          // Skip if no userId
          if (!match || !match.userId) {
            console.warn("Match without userId found:", match);
            return;
          }
          
          // Skip if we've already seen this userId
          if (seenUserIds.has(match.userId)) {
            console.log(`Skipping duplicate match: ${match.userId} (${match.name || 'Unknown'})`);
            return;
          }
          
          // Add to both Map and Set for tracking
          uniqueMap.set(match.userId, match);
          seenUserIds.add(match.userId);
        });
        
        const uniqueMatches = Array.from(uniqueMap.values());
        console.log(`Found ${sortedMatches.length} matches, ${uniqueMatches.length} unique after deduplication`);
        console.log("Unique match IDs:", uniqueMatches.map(m => m.userId));
        
        // Additional check: filter out any remaining duplicates by userId
        const finalMatches = uniqueMatches.filter((match, index, self) => 
          index === self.findIndex(m => m.userId === match.userId)
        );
        
        if (finalMatches.length !== uniqueMatches.length) {
          console.warn(`Additional duplicates found! ${uniqueMatches.length} -> ${finalMatches.length}`);
        }
        
        // Ensure final matches are sorted high to low
        finalMatches.sort((a, b) => {
          const scoreA = a.score || 0;
          const scoreB = b.score || 0;
          return scoreB - scoreA; // High to low
        });
        
        setMatches(finalMatches);
        setFilteredMatches(finalMatches); // Initially show all matches
        if (finalMatches.length > 0) {
          // Fetch preferences for all matches
          finalMatches.forEach(match => {
            fetchMatchDetails(match.userId);
          });
          
          // Fetch current user name and preferences for filtering
          const currentUserId = localStorage.getItem("userId");
          if (currentUserId) {
            axios.get(`http://localhost:5001/api/user/${currentUserId}`)
              .then(res => {
                setCurrentUserName(res.data.name || "You");
                // Apply filters based on user preferences
                applyFilters(finalMatches, res.data);
              })
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

  const applyFilters = async (matchesList, currentUser) => {
    if (!currentUser) {
      // Fetch current user if not provided
      const userId = localStorage.getItem("userId");
      if (userId) {
        try {
          const res = await axios.get(`http://localhost:5001/api/user/${userId}`);
          applyFilters(matchesList, res.data);
          return;
        } catch (err) {
          console.error("Error fetching current user for filters:", err);
          setFilteredMatches(matchesList);
          return;
        }
      } else {
        setFilteredMatches(matchesList);
        return;
      }
    }

    let filtered = [...matchesList];

    // Age filter
    if (filterByAge && currentUser.ageRangeMin !== undefined && currentUser.ageRangeMax !== undefined) {
      // Fetch age for each match
      const matchesWithAge = await Promise.all(
        filtered.map(async (match) => {
          try {
            const userRes = await axios.get(`http://localhost:5001/api/user/${match.userId}`);
            return { ...match, matchAge: userRes.data.age };
          } catch (err) {
            return { ...match, matchAge: null };
          }
        })
      );
      filtered = matchesWithAge.filter(match => {
        if (match.matchAge === null || match.matchAge === undefined) return true; // Allow if age unknown
        return match.matchAge >= currentUser.ageRangeMin && match.matchAge <= currentUser.ageRangeMax;
      });
    }

    // Location filter
    if (filterByLocation && currentUser.maxDistance !== undefined && currentUser.maxDistance > 0) {
      const currentCity = (currentUser.city || "").toLowerCase();
      const currentRegion = (currentUser.location || currentUser.region || "").toLowerCase();
      
      const matchesWithLocation = await Promise.all(
        filtered.map(async (match) => {
          try {
            const userRes = await axios.get(`http://localhost:5001/api/user/${match.userId}`);
            return {
              ...match,
              matchCity: (userRes.data.city || "").toLowerCase(),
              matchRegion: (userRes.data.location || userRes.data.region || "").toLowerCase()
            };
          } catch (err) {
            return { ...match, matchCity: "", matchRegion: "" };
          }
        })
      );
      
      filtered = matchesWithLocation.filter(match => {
        // If location info is missing, allow the match
        if (!match.matchCity && !match.matchRegion) return true;
        if (!currentCity && !currentRegion) return true;
        
        // Apply distance filter
        if (currentUser.maxDistance <= 20) {
          // Require same city
          return !match.matchCity || !currentCity || match.matchCity === currentCity;
        } else if (currentUser.maxDistance <= 30) {
          // Allow same region if cities are different
          if (match.matchCity && currentCity && match.matchCity !== currentCity) {
            return match.matchRegion && currentRegion && match.matchRegion === currentRegion;
          }
          return true;
        }
        // For 50+ miles, allow any location
        return true;
      });
    }

    setFilteredMatches(filtered);
  };

  const handleFilterToggle = async () => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      try {
        const res = await axios.get(`http://localhost:5001/api/user/${userId}`);
        await applyFilters(matches, res.data);
      } catch (err) {
        console.error("Error fetching user for filters:", err);
      }
    }
  };

  const handleContinueToMatches = () => {
    setShowFilters(false);
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
      const displayMatches = showFilters ? matches : filteredMatches;
      const matchUserId = displayMatches[index].userId;
      
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
        
        const displayMatches = showFilters ? matches : filteredMatches;
        if (isMatch) {
          // It's a confirmed match! Both users liked each other
          console.log("🎉 It's a match!", displayMatches[index].name);
          console.log("Setting matched user:", displayMatches[index]);
          
          // Set both states together
          const matchedUserData = { ...displayMatches[index] };
          setMatchedUser(matchedUserData);
          setShowMatchModal(true);
          
          console.log("Match modal state - showMatchModal: true, matchedUser:", matchedUserData.name);
          
          // Don't advance yet - wait for user to close modal
          return;
        } else {
          // Not a match yet - just a like (pending)
          const likedName = displayMatches[index]?.name || "them";
          console.log("You liked", likedName, "- waiting for them to like you back");
          
          // Show "like sent" modal - ensure name is set before showing modal
          setLikedUserName(likedName);
          // Use setTimeout to ensure state is updated before showing modal
          setTimeout(() => {
            setShowLikeSentModal(true);
          }, 0);
          
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
        const displayMatches = showFilters ? matches : filteredMatches;
        console.log(`Moving from index ${prevIndex} to ${nextIndex}`);
        if (nextIndex < displayMatches.length) {
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
    const displayMatches = showFilters ? matches : filteredMatches;
    if (currentIndex < displayMatches.length) {
      console.log(`HandleLike: currentIndex=${currentIndex}, match=${displayMatches[currentIndex]?.name}`);
      await swiped('right', currentIndex);
    }
  };

  const handlePass = () => {
    const displayMatches = showFilters ? matches : filteredMatches;
    if (currentIndex < displayMatches.length) {
      console.log(`HandlePass: currentIndex=${currentIndex}, match=${displayMatches[currentIndex]?.name}`);
      swiped('left', currentIndex);
    }
  };

  const handleCloseMatchModal = () => {
    setShowMatchModal(false);
    setMatchedUser(null);
    // Move to next match after closing modal
    setCurrentIndex(prevIndex => {
      const displayMatches = showFilters ? matches : filteredMatches;
      if (prevIndex < displayMatches.length - 1) {
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
      const displayMatches = showFilters ? matches : filteredMatches;
      if (prevIndex < displayMatches.length - 1) {
        return prevIndex + 1;
      }
      return prevIndex;
    });
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex justify-center items-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-white mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-white text-xl">Loading your matches…</p>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden flex flex-col justify-center items-center">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-96 h-96 bg-blue-500 rounded-full opacity-10 blur-3xl animate-pulse" style={{ top: '20%', left: '20%' }}></div>
          <div className="absolute w-96 h-96 bg-purple-500 rounded-full opacity-10 blur-3xl animate-pulse" style={{ bottom: '20%', right: '20%', animationDelay: '1s' }}></div>
        </div>
        <div className="relative z-10 text-center">
          <div className="text-6xl mb-6">💔</div>
          <h2 className="text-3xl font-bold text-white mb-2">No matches found yet</h2>
          <p className="text-white/70 text-lg">Try updating your preferences!</p>
        </div>
      </div>
    );
  }

  // Show filter UI first
  if (showFilters && matches.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden flex flex-col items-center justify-center p-6">
        {/* Animated Background */}
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
        </div>
        <div className="relative z-10 w-full max-w-md">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-20"></div>
            <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
              <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Filter Your Matches</h1>
          
          <div className="space-y-6">
            {/* Age Filter Toggle */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
              <div>
                <label className="text-lg font-semibold text-white">Filter by Age Range</label>
                <p className="text-sm text-white/60">Show only matches within your preferred age range</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterByAge}
                  onChange={(e) => {
                    setFilterByAge(e.target.checked);
                    setTimeout(handleFilterToggle, 100);
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-indigo-500"></div>
              </label>
            </div>

            {/* Location Filter Toggle */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
              <div>
                <label className="text-lg font-semibold text-white">Filter by Location</label>
                <p className="text-sm text-white/60">Show only matches within your preferred distance</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterByLocation}
                  onChange={(e) => {
                    setFilterByLocation(e.target.checked);
                    setTimeout(handleFilterToggle, 100);
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-indigo-500"></div>
              </label>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <button
              onClick={handleContinueToMatches}
              className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 px-6 py-3 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl text-white"
            >
              View {filteredMatches.length || matches.length} Matches →
            </button>
            <button
              onClick={() => {
                setFilterByAge(false);
                setFilterByLocation(false);
                setFilteredMatches(matches);
                handleContinueToMatches();
              }}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-all duration-300 backdrop-blur-sm border border-white/20 text-white"
            >
              Show All
            </button>
          </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Use filteredMatches instead of matches for display
  const displayMatches = showFilters ? matches : filteredMatches;
  
  if (currentIndex >= displayMatches.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden flex flex-col justify-center items-center">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-96 h-96 bg-blue-500 rounded-full opacity-10 blur-3xl animate-pulse" style={{ top: '20%', left: '20%' }}></div>
          <div className="absolute w-96 h-96 bg-purple-500 rounded-full opacity-10 blur-3xl animate-pulse" style={{ bottom: '20%', right: '20%', animationDelay: '1s' }}></div>
        </div>
        <div className="relative z-10 text-center">
          <div className="text-6xl mb-6">🎉</div>
          <h2 className="text-3xl font-bold text-white mb-2">You've seen all matches!</h2>
          <p className="text-white/70 text-lg">Check back later for more matches.</p>
        </div>
      </div>
    );
  }

  const displayMatch = displayMatches[currentIndex];

  // Debug: Log modal state on every render
  if (showMatchModal || matchedUser) {
    console.log("🔍 Modal Debug - showMatchModal:", showMatchModal, "matchedUser:", matchedUser?.name);
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
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 pt-24">
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
              We've let <span className="font-bold">{likedUserName || "them"}</span> know that you would like to connect!
            </p>

            {/* Subtitle */}
            <p className="text-base text-white/80 mb-8">
              If they like you back, you'll both be notified! 🎉
            </p>

            {/* Continue Button */}
              <button
                onClick={handleCloseLikeSentModal}
                className="w-full bg-white text-purple-600 hover:bg-gray-50 px-8 py-4 rounded-full text-lg font-bold shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-3xl flex items-center justify-center gap-2"
                style={{
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <span>Continue Swiping</span>
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
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Chat with them</span>
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
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <span>Start a Jam Session</span>
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
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Start a Watch Party</span>
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
      <div className="text-white/80 mb-4 text-sm font-semibold bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
        {currentIndex + 1} of {displayMatches.length} {displayMatches[currentIndex] ? `- ${displayMatches[currentIndex].name}` : ''}
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
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden h-full flex flex-col">
                {/* Profile Pictures - Big */}
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
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 rounded-full font-bold text-sm text-white shadow-lg backdrop-blur-sm border border-white/20">
                    {((match.score || 0) * 100).toFixed(0)}% Match
                  </div>
                </div>

                {/* User Details - Fits in remaining space */}
                <div className="flex-1 p-6 flex flex-col min-h-0">
                  <h2 className="text-2xl font-bold mb-1 text-white">{match.name}</h2>
                  <p className="text-white/60 mb-3 text-sm">{match.email}</p>

                  {/* Preferences - Scrollable if needed, but try to fit */}
                  {matchPreferences[match.userId] && (
                    <div className="space-y-2 flex-1 overflow-y-auto pr-2 min-h-0">
                      {/* Movies */}
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
                              <span
                                key={idx}
                                className="bg-blue-500/20 border border-blue-500/30 px-3 py-1 rounded-full text-xs text-blue-200 backdrop-blur-sm"
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
                          <h3 className="text-base font-semibold mb-2 text-purple-300 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                            Music
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {matchPreferences[match.userId].music.slice(0, 4).map((artist, idx) => (
                              <span
                                key={idx}
                                className="bg-purple-500/20 border border-purple-500/30 px-3 py-1 rounded-full text-xs text-purple-200 backdrop-blur-sm"
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
                          <h3 className="text-base font-semibold mb-2 text-pink-300 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            TV Shows
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {matchPreferences[match.userId].shows.slice(0, 4).map((show, idx) => (
                              <span
                                key={idx}
                                className="bg-pink-500/20 border border-pink-500/30 px-3 py-1 rounded-full text-xs text-pink-200 backdrop-blur-sm"
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
          className="w-16 h-16 rounded-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 flex items-center justify-center text-white shadow-lg transition-all duration-300 transform hover:scale-110 active:scale-95"
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <button
          onClick={handleLike}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 flex items-center justify-center text-white shadow-lg transition-all duration-300 transform hover:scale-110 active:scale-95"
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
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

export default MatchList;
