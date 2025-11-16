import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import TinderCard from "../components/TinderCard";
import GeminiLoading from "../components/GeminiLoading";

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
  const [filterByAge, setFilterByAge] = useState(false); // Default to false - don't filter by default
  const [filterByLocation, setFilterByLocation] = useState(false); // Default to false - don't filter by default
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [showGeminiLoading, setShowGeminiLoading] = useState(true);
  const [filtersInitialized, setFiltersInitialized] = useState(false);

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
          setShowGeminiLoading(false);
          return;
        }

        // Show Gemini loading for at least 3 seconds for better UX
        const minLoadingTime = 3000;
        const startTime = Date.now();

        console.log("Fetching matches for user:", userId);
        const res = await axios.get(`http://localhost:5001/api/match/${userId}`);
        
        console.log("Matches response:", res.data);
        const matchesList = res.data.matches || [];
        console.log(`Found ${matchesList.length} matches from backend`);
        console.log(`[MatchList] Backend matches:`, matchesList.map((m, i) => `${i+1}. ${m.name} (${m.userId}) - Email: ${m.email} - Score: ${((m.score || 0) * 100).toFixed(1)}%`));
        
        // Validate match data - ensure name, userId, and email are consistent
        // Also fix any mismatches by fetching correct user data
        const validatedMatches = [];
        for (let idx = 0; idx < matchesList.length; idx++) {
          let match = { ...matchesList[idx] }; // Create a copy to avoid mutating original
          
          if (!match.userId) {
            console.error(`[MatchList] Match ${idx} missing userId:`, match);
            continue; // Skip this match
          }
          if (!match.name) {
            console.error(`[MatchList] Match ${idx} missing name:`, match);
            continue; // Skip this match
          }
          if (!match.email) {
            console.warn(`[MatchList] Match ${idx} missing email:`, match);
          }
          
          // CRITICAL: Always fetch the correct user data from backend to ensure consistency
          // This ensures name, email, and userId all come from the same user record
          try {
            const userRes = await axios.get(`http://localhost:5001/api/user/${match.userId}`);
            const correctUser = userRes.data;
            
            // Verify the userId matches
            if (correctUser.id !== match.userId) {
              console.error(`[MatchList] ⚠️ CRITICAL: User ID mismatch! Match userId: ${match.userId}, User id: ${correctUser.id}`);
              console.error(`[MatchList] Skipping match ${idx} due to userId mismatch`);
              continue; // Skip this match
            }
            
            // Always use the correct user data from the backend
            match.name = correctUser.name;
            match.email = correctUser.email;
            match.profileImages = correctUser.profileImages || match.profileImages;
            match.imageUrl = correctUser.imageUrl || match.imageUrl;
            
            console.log(`[MatchList] ✅ Verified match ${idx}: name="${match.name}", email="${match.email}", userId="${match.userId}"`);
          } catch (err) {
            console.error(`[MatchList] Failed to fetch user data for userId ${match.userId}:`, err);
            // Skip this match if we can't verify the data
            console.error(`[MatchList] Skipping match ${idx} due to unable to fetch user data`);
            continue; // Don't add this match
          }
          
          validatedMatches.push(match);
        }
        
        // Use validated matches
        const finalMatchesList = validatedMatches;
        
        // Filter matches by 60% threshold (score >= 0.6)
        const filteredMatches = finalMatchesList.filter(match => {
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
        
        // CRITICAL: Remove duplicates based on userId - use multiple passes for safety
        // First pass: Use Map to deduplicate (keeps first occurrence)
        const uniqueMap = new Map();
        const seenUserIds = new Set();
        
        sortedMatches.forEach(match => {
          // Skip if no userId
          if (!match || !match.userId) {
            console.warn("Match without userId found:", match);
            return;
          }
          
          // Normalize userId
          const normalizedUserId = String(match.userId).trim();
          
          // Skip if we've already seen this userId
          if (seenUserIds.has(normalizedUserId)) {
            console.warn(`[MatchList] ⚠️ Skipping duplicate match: ${normalizedUserId} (${match.name || 'Unknown'})`);
            return;
          }
          
          // Add to both Map and Set for tracking
          uniqueMap.set(normalizedUserId, match);
          seenUserIds.add(normalizedUserId);
        });
        
        const uniqueMatches = Array.from(uniqueMap.values());
        console.log(`[MatchList] First pass: ${sortedMatches.length} -> ${uniqueMatches.length} unique matches`);
        
        // Second pass: Additional filter to catch any remaining duplicates
        const finalMatches = [];
        const finalSeenUserIds = new Set();
        
        uniqueMatches.forEach((match, index) => {
          const normalizedUserId = String(match.userId).trim();
          if (!finalSeenUserIds.has(normalizedUserId)) {
            finalSeenUserIds.add(normalizedUserId);
            finalMatches.push(match);
          } else {
            console.error(`[MatchList] ❌ CRITICAL: Found duplicate in second pass: ${normalizedUserId} (${match.name}) at index ${index}`);
          }
        });
        
        console.log(`[MatchList] Second pass: ${uniqueMatches.length} -> ${finalMatches.length} final unique matches`);
        console.log(`[MatchList] Final matches:`, finalMatches.map((m, i) => `${i+1}. ${m.name} (${m.userId}) - Score: ${((m.score || 0) * 100).toFixed(1)}%`));
        
        // Final verification: Check for any remaining duplicates
        const finalUserIds = finalMatches.map(m => String(m.userId).trim());
        const duplicateUserIds = finalUserIds.filter((id, index) => finalUserIds.indexOf(id) !== index);
        if (duplicateUserIds.length > 0) {
          console.error(`[MatchList] ❌ CRITICAL ERROR: Found ${duplicateUserIds.length} duplicate userIds after all filtering:`, duplicateUserIds);
          // Remove duplicates one more time - keep only first occurrence
          const trulyUnique = [];
          const trulySeen = new Set();
          for (const match of finalMatches) {
            const id = String(match.userId).trim();
            if (!trulySeen.has(id)) {
              trulySeen.add(id);
              trulyUnique.push(match);
            }
          }
          console.error(`[MatchList] Removed ${finalMatches.length - trulyUnique.length} additional duplicates`);
          return trulyUnique;
        }
        
        // Ensure final matches are sorted high to low
        finalMatches.sort((a, b) => {
          const scoreA = a.score || 0;
          const scoreB = b.score || 0;
          return scoreB - scoreA; // High to low
        });
        
        setMatches(finalMatches);
        // Initialize filteredMatches with all matches - don't apply filters automatically
        setFilteredMatches(finalMatches);
        setFiltersInitialized(true); // Set to true immediately since we're not filtering by default
        console.log(`[MatchList] Initialized: ${finalMatches.length} matches, filteredMatches set to ${finalMatches.length}`);
        console.log(`[MatchList] Match names:`, finalMatches.map(m => `${m.name} (${m.userId})`));
        
        if (finalMatches.length > 0) {
          // Fetch preferences for all matches - verify userId is correct
          finalMatches.forEach((match, idx) => {
            if (!match.userId) {
              console.error(`[MatchList] ERROR: Match ${idx} missing userId!`, match);
              return;
            }
            console.log(`[MatchList] Fetching preferences for match ${idx}: ${match.name} (userId: ${match.userId})`);
            fetchMatchDetails(match.userId);
          });
          
          // Fetch current user name (but don't apply filters automatically)
          const currentUserId = localStorage.getItem("userId");
          if (currentUserId) {
            axios.get(`http://localhost:5001/api/user/${currentUserId}`)
              .then(res => {
                setCurrentUserName(res.data.name || "You");
                // Don't apply filters automatically - only when user toggles switches
              })
              .catch(err => {
                console.error("Error fetching current user:", err);
              });
          }
        } else {
          // No matches
          setFilteredMatches([]);
        }
        
        // Ensure minimum loading time for Gemini animation
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
        await new Promise(resolve => setTimeout(resolve, remainingTime));
        
        // Hide Gemini loading and show matches
        setShowGeminiLoading(false);
      } catch (err) {
        console.error("Error fetching matches:", err);
        console.error("Error details:", err.response?.data);
        setShowGeminiLoading(false);
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
      console.log(`[MatchList] Fetched preferences for userId ${userId}:`, prefRes.data);
      setMatchPreferences(prev => ({
        ...prev,
        [userId]: prefRes.data
      }));
    } catch (err) {
      console.error(`[MatchList] Error fetching match preferences for userId ${userId}:`, err);
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
    setFiltersInitialized(true);
    console.log(`[MatchList] Applied filters: ${filtered.length} matches after filtering (from ${matchesList.length} total)`);
    console.log(`[MatchList] Filtered match names:`, filtered.map(m => `${m.name} (${m.userId})`));
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
          const matchData = displayMatches[index];
          console.log("🎉 It's a match!", matchData.name);
          console.log("Setting matched user:", matchData);
          console.log("Match data - name:", matchData.name, "userId:", matchData.userId, "email:", matchData.email);
          
          // Verify match data consistency
          if (!matchData.userId) {
            console.error("ERROR: Match data missing userId!", matchData);
          }
          if (!matchData.name) {
            console.error("ERROR: Match data missing name!", matchData);
          }
          
          // Set both states together
          const matchedUserData = { ...matchData };
          setMatchedUser(matchedUserData);
          setShowMatchModal(true);
          
          console.log("Match modal state - showMatchModal: true, matchedUser:", matchedUserData.name, "userId:", matchedUserData.userId);
          
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
    } else if (direction === 'left') {
      // Pass - send pass to backend
      const userId = localStorage.getItem("userId");
      const displayMatches = showFilters ? matches : filteredMatches;
      const matchUserId = displayMatches[index].userId;
      
      console.log(`Sending pass from ${userId} to ${matchUserId}`);
      
      try {
        await axios.post("http://localhost:5001/api/pass", {
          fromUser: userId,
          toUser: matchUserId
        });
        console.log("Pass sent successfully");
      } catch (err) {
        console.error("Error sending pass:", err);
        console.error("Error response:", err.response?.data);
      }
    }
    
    // Move to next match after a short delay with animation
    // Use functional update to get the latest currentIndex
    setTimeout(() => {
      setCurrentIndex(prevIndex => {
        const nextIndex = prevIndex + 1;
        const displayMatches = showFilters ? matches : filteredMatches;
        console.log(`Moving from index ${prevIndex} to ${nextIndex}`);
        if (nextIndex < displayMatches.length) {
          // Trigger animation by briefly setting opacity to 0, then back to 1
          return nextIndex;
        } else {
          console.log("No more matches");
          return prevIndex; // Stay at current if no more matches
        }
      });
    }, 400); // Slightly longer delay for smoother animation
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

  // Show Gemini loading screen when first loading matches
  if (showGeminiLoading || loading) {
    return <GeminiLoading message="Gemini is finding matches for you" />;
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

  // Show filter UI first
  if (showFilters && matches.length > 0) {
    // Calculate display count: 
    // - If filters are active (age or location), use filteredMatches.length
    // - Otherwise, use matches.length (all matches)
    const displayCount = (filterByAge || filterByLocation) ? filteredMatches.length : matches.length;
    console.log(`[MatchList] Filter UI - matches.length: ${matches.length}, filteredMatches.length: ${filteredMatches.length}, filterByAge: ${filterByAge}, filterByLocation: ${filterByLocation}, displayCount: ${displayCount}`);
    console.log(`[MatchList] Filter UI - Match names in matches:`, matches.map(m => `${m.name} (${m.userId})`));
    console.log(`[MatchList] Filter UI - Match names in filteredMatches:`, filteredMatches.map(m => `${m.name} (${m.userId})`));
    
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-6">
        <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md shadow-xl">
          <h1 className="text-3xl font-bold mb-6 text-center">Filter Your Matches</h1>
          
          <div className="space-y-6">
            {/* Age Filter Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div>
                <label className="text-lg font-semibold">Filter by Age Range</label>
                <p className="text-sm text-gray-400">Show only matches within your preferred age range</p>
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
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Location Filter Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div>
                <label className="text-lg font-semibold">Filter by Location</label>
                <p className="text-sm text-gray-400">Show only matches within your preferred distance</p>
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
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={handleContinueToMatches}
              className="w-full bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg text-lg font-semibold transition"
            >
              View {displayCount} Matches →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Use filteredMatches instead of matches for display
  const displayMatches = showFilters ? matches : filteredMatches;
  
  if (currentIndex >= displayMatches.length) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-white bg-[#0f172a]">
        <div className="text-4xl mb-4">🎉</div>
        <div className="text-xl">You've seen all matches!</div>
        <div className="text-gray-400 mt-2">Check back later for more matches.</div>
      </div>
    );
  }

  const displayMatch = displayMatches[currentIndex];

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
              We've let <span className="font-bold">{likedUserName || "them"}</span> know that you would like to connect!
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


      {/* Tinder Card */}
      <div className="relative w-full max-w-md" style={{ height: '85vh', maxHeight: '700px' }}>
        {displayMatches.length > 0 && currentIndex < displayMatches.length && displayMatches.map((match, index) => {
          // Only show current card and next 2 cards for smooth transitions
          if (index < currentIndex) return null;
          if (index > currentIndex + 2) return null;
          
          const isCurrent = index === currentIndex;
          const isNext = index === currentIndex + 1;
          
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
              className={`
                transition-all duration-500 ease-in-out
                ${isCurrent ? 'opacity-100 scale-100 z-10 translate-x-0' : 'opacity-0 scale-95 z-0 translate-x-20'}
                ${isNext ? 'opacity-30 scale-90 -translate-x-4' : ''}
              `}
            >
              <div className={`bg-gray-800 rounded-2xl shadow-2xl overflow-hidden h-full flex flex-col ${isCurrent ? 'animate-slide-in' : ''}`}>
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
                  <div className="absolute top-4 right-4 bg-blue-600 px-4 py-2 rounded-full font-bold text-sm">
                    {((match.score || 0) * 100).toFixed(0)}% Match
                  </div>
                </div>

                {/* User Details - Fits in remaining space */}
                <div className="flex-1 p-6 flex flex-col min-h-0">
                  <h2 className="text-2xl font-bold mb-1">{match.name}</h2>
                  <p className="text-gray-400 mb-3 text-sm">{match.email}</p>
                  
                  {/* Debug: Verify match data is correct */}
                  {(() => {
                    console.log(`[MatchList] Card ${index}: name="${match.name}", userId="${match.userId}", email="${match.email}"`);
                    console.log(`[MatchList] Preferences for ${match.userId}:`, matchPreferences[match.userId] ? 'Found' : 'Missing');
                    
                    // CRITICAL: Verify data consistency
                    if (match.email && match.name) {
                      // Check if email matches the name (basic sanity check)
                      const emailName = match.email.split('@')[0].toLowerCase();
                      const matchName = match.name.toLowerCase().replace(/\s*\(.*?\)\s*/g, '').replace(/\s+/g, '');
                      if (!emailName.includes(matchName) && !matchName.includes(emailName)) {
                        console.error(`[MatchList] ⚠️ WARNING: Name/Email mismatch! name="${match.name}", email="${match.email}"`);
                      }
                    }
                    
                    return null;
                  })()}

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

      {/* Add CSS animations for card transitions */}
      <style>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
}

export default MatchList;
