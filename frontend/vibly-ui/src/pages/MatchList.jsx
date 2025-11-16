import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import TinderCard from "../components/TinderCard";
import GeminiLoading from "../components/GeminiLoading";

function MatchList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [matches, setMatches] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false); // Don't show loading until mode is selected
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
  const [showGeminiLoading, setShowGeminiLoading] = useState(false); // Don't show loading until mode is selected
  const [filtersInitialized, setFiltersInitialized] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  // Initialize mode from localStorage immediately, or show selection if not set
  const [matchingMode, setMatchingMode] = useState(() => {
    const savedMode = localStorage.getItem("matchingMode");
    return savedMode || null; // null means no mode selected yet - will show selection
  });
  const [showModeSelection, setShowModeSelection] = useState(() => {
    // Check localStorage immediately on mount
    const savedMode = localStorage.getItem("matchingMode");
    const shouldShow = !savedMode; // Show selection if no saved mode
    console.log("[MatchList] Initial state - savedMode:", savedMode, "showModeSelection:", shouldShow);
    return shouldShow;
  });

  // Track mouse position for animated background
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

  // Debug: Log when currentIndex changes
  useEffect(() => {
    const displayMatches = showFilters ? matches : filteredMatches;
    console.log(`Current index changed to: ${currentIndex}, match: ${displayMatches[currentIndex]?.name || 'none'}`);
  }, [currentIndex, matches, filteredMatches, showFilters]);

  // Show mode selection based on navigation source
  useEffect(() => {
    const savedMode = localStorage.getItem("matchingMode");
    const skipModeSelection = location.state?.skipModeSelection;
    
    console.log("[MatchList] Navigation state:", location.state);
    console.log("[MatchList] Skip mode selection:", skipModeSelection);
    console.log("[MatchList] Saved mode:", savedMode);
    
    // If coming from Preferences page, skip mode selection and use saved/default mode
    if (skipModeSelection) {
      console.log("[MatchList] Coming from Preferences - skipping mode selection");
      const modeToUse = savedMode || "preferences";
      setMatchingMode(modeToUse);
      setShowModeSelection(false);
      // Clear the state so it doesn't persist on refresh
      navigate(location.pathname, { replace: true, state: {} });
    } else {
      // Coming from login or profile edit - show mode selection
      console.log("[MatchList] Coming from login/profile - showing mode selection");
      if (savedMode) {
        // Pre-select the saved mode, but still show the selection screen
        console.log("[MatchList] Found saved mode:", savedMode, "- will pre-select but show selection");
        setMatchingMode(savedMode);
      } else {
        // No saved mode - default to preferences
        console.log("[MatchList] No saved mode found - defaulting to preferences");
        setMatchingMode("preferences");
      }
      
      // Show mode selection screen
      setShowModeSelection(true);
    }
    
    setLoading(false);
    setShowGeminiLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  useEffect(() => {
    // Don't fetch if mode selection is showing OR if no mode is set
    if (showModeSelection || !matchingMode) {
      console.log("[MatchList] Skipping fetch - showModeSelection:", showModeSelection, "matchingMode:", matchingMode);
      return;
    }

    console.log("[MatchList] Fetching matches with mode:", matchingMode);
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

        console.log("Fetching matches for user:", userId, "mode:", matchingMode);
        const res = await axios.get(`http://localhost:5001/api/match/${userId}?mode=${matchingMode}`);
        
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
        
        // Filter matches by 60% threshold (score >= 0.6) for preferences mode
        // For location mode, use a lower threshold (0.4) since scores are based on proximity
        const scoreThreshold = matchingMode === "location" ? 0.4 : 0.6;
        const filteredMatches = finalMatchesList.filter(match => {
          const score = match.score || 0;
          return score >= scoreThreshold;
        });
        console.log(`Filtered to ${filteredMatches.length} matches with ${(scoreThreshold * 100).toFixed(0)}%+ compatibility (mode: ${matchingMode})`);
        
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
  }, [matchingMode, showModeSelection]);

  const handleModeSelection = (mode) => {
    console.log("[MatchList] User selected mode:", mode);
    // Just update the mode state, don't hide selection yet - user needs to click "Continue"
    setMatchingMode(mode);
  };

  const handleContinueWithMode = () => {
    if (!matchingMode) {
      // Default to preferences if somehow no mode is set
      setMatchingMode("preferences");
    }
    console.log("[MatchList] Continuing with mode:", matchingMode || "preferences");
    localStorage.setItem("matchingMode", matchingMode || "preferences");
    setShowModeSelection(false);
    // Now trigger match fetching after mode is confirmed
    setShowGeminiLoading(true);
    setLoading(true);
    console.log("[MatchList] Mode saved, will fetch matches now");
  };

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
    
    // CRITICAL: Capture match data BEFORE any state changes
    const displayMatches = showFilters ? matches : filteredMatches;
    const currentMatch = displayMatches[index];
    if (!currentMatch) {
      console.error("No match found at index", index);
      return;
    }
    
    const matchUserId = currentMatch.userId;
    const matchName = currentMatch.name || "them";
    const userId = localStorage.getItem("userId");
    
    // Note: We'll advance the index after processing the like/pass
    // This ensures we handle matches correctly (removing from array first)
    
    if (direction === 'right') {
      // Like - send like to backend
      console.log(`[MatchList] Sending like from ${userId} to ${matchUserId} (${matchName})`);
      console.log(`[MatchList] Match data - name: ${matchName}, userId: ${matchUserId}, email: ${currentMatch.email}`);
      
      // Double-check: Verify the userId matches the name we're displaying
      if (currentMatch.name !== matchName) {
        console.error(`[MatchList] ⚠️ WARNING: Name mismatch! currentMatch.name: ${currentMatch.name}, matchName: ${matchName}`);
      }
      
      try {
        const response = await axios.post("http://localhost:5001/api/match-status/like", {
          fromUser: userId,
          toUser: matchUserId
        });
        
        console.log(`[MatchList] Like sent successfully - fromUser: ${userId}, toUser: ${matchUserId} (${matchName})`);
        
        console.log("Like response:", response.data);
        console.log("Response match status:", response.data.match);
        console.log("Response success:", response.data.success);
        
        // Check if it's a mutual match (both users liked each other)
        const isMatch = response.data.match === "confirmed";
        console.log("Is match?", isMatch);
        console.log("Match status:", response.data.match);
        
        if (isMatch) {
          // It's a confirmed match! Both users liked each other
          console.log("🎉 It's a match!", matchName);
          console.log("Setting matched user:", currentMatch);
          console.log("Match data - name:", matchName, "userId:", matchUserId, "email:", currentMatch.email);
          
          // Verify match data consistency
          if (!matchUserId) {
            console.error("ERROR: Match data missing userId!", currentMatch);
          }
          if (!matchName) {
            console.error("ERROR: Match data missing name!", currentMatch);
          }
          
          // CRITICAL: Remove matched user from matches array immediately
          // This prevents them from appearing again after closing the modal
          setMatches(prevMatches => {
            const filtered = prevMatches.filter(m => m.userId !== matchUserId);
            console.log(`[MatchList] Removed matched user ${matchName} from matches. Remaining: ${filtered.length}`);
            return filtered;
          });
          setFilteredMatches(prevFiltered => {
            const filtered = prevFiltered.filter(m => m.userId !== matchUserId);
            console.log(`[MatchList] Removed matched user ${matchName} from filteredMatches. Remaining: ${filtered.length}`);
            return filtered;
          });
          
          // Adjust index after removing the matched user
          // Since we removed the user at the current index, we need to adjust
          // Use setTimeout to ensure state updates have been applied
          setTimeout(() => {
            setCurrentIndex(prevIndex => {
              const displayMatches = showFilters ? matches : filteredMatches;
              // If we were at or beyond the last index, go to the last valid index
              if (prevIndex >= displayMatches.length) {
                return Math.max(0, displayMatches.length - 1);
              }
              // Otherwise stay at same index (which now points to next user after removal)
              return prevIndex;
            });
          }, 0);
          
          // Set both states together with captured data
          const matchedUserData = { ...currentMatch };
          setMatchedUser(matchedUserData);
          setShowMatchModal(true);
          
          console.log("Match modal state - showMatchModal: true, matchedUser:", matchName, "userId:", matchUserId);
        } else {
          // Not a match yet - just a like (pending)
          console.log("You liked", matchName, "- waiting for them to like you back");
          
          // Remove liked user from matches array (they've been liked, don't show again)
          setMatches(prevMatches => {
            const filtered = prevMatches.filter(m => m.userId !== matchUserId);
            console.log(`[MatchList] Removed liked user ${matchName} from matches. Remaining: ${filtered.length}`);
            return filtered;
          });
          setFilteredMatches(prevFiltered => {
            const filtered = prevFiltered.filter(m => m.userId !== matchUserId);
            console.log(`[MatchList] Removed liked user ${matchName} from filteredMatches. Remaining: ${filtered.length}`);
            return filtered;
          });
          
          // Adjust index after removing the liked user
          setTimeout(() => {
            setCurrentIndex(prevIndex => {
              const displayMatches = showFilters ? matches : filteredMatches;
              if (prevIndex >= displayMatches.length) {
                return Math.max(0, displayMatches.length - 1);
              }
              return prevIndex; // Stay at same index (which now points to next user)
            });
          }, 0);
          
          // Show "like sent" modal with captured name
          setLikedUserName(matchName);
          // Use setTimeout to ensure state is updated before showing modal
          setTimeout(() => {
            setShowLikeSentModal(true);
          }, 0);
        }
      } catch (err) {
        console.error("Error sending like:", err);
        console.error("Error response:", err.response?.data);
      }
    } else if (direction === 'left') {
      // Pass - send pass to backend
      console.log(`Sending pass from ${userId} to ${matchUserId} (${matchName})`);
      
      try {
        await axios.post("http://localhost:5001/api/pass", {
          fromUser: userId,
          toUser: matchUserId
        });
        console.log("Pass sent successfully");
        
        // Remove passed user from matches array (they've been passed, don't show again)
        setMatches(prevMatches => {
          const filtered = prevMatches.filter(m => m.userId !== matchUserId);
          console.log(`[MatchList] Removed passed user ${matchName} from matches. Remaining: ${filtered.length}`);
          return filtered;
        });
        setFilteredMatches(prevFiltered => {
          const filtered = prevFiltered.filter(m => m.userId !== matchUserId);
          console.log(`[MatchList] Removed passed user ${matchName} from filteredMatches. Remaining: ${filtered.length}`);
          return filtered;
        });
        
        // Adjust index after removing the passed user
        setTimeout(() => {
          setCurrentIndex(prevIndex => {
            const displayMatches = showFilters ? matches : filteredMatches;
            if (prevIndex >= displayMatches.length) {
              return Math.max(0, displayMatches.length - 1);
            }
            return prevIndex; // Stay at same index (which now points to next user)
          });
        }, 0);
      } catch (err) {
        console.error("Error sending pass:", err);
        console.error("Error response:", err.response?.data);
      }
    }
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

  // CRITICAL: Show mode selection FIRST - before any other rendering
  // This must be the first check and return early
  if (showModeSelection) {
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
        <div className="relative z-10 w-full max-w-2xl">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-20"></div>
            <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
              <h1 className="text-4xl font-bold mb-2 text-center bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Choose Matching Mode
              </h1>
              <p className="text-center text-white/70 mb-8">How would you like to find your matches?</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Preferences + Age/Location Mode */}
                <button
                  onClick={() => handleModeSelection("preferences")}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 text-left group ${
                    matchingMode === "preferences"
                      ? "bg-white/10 border-purple-400/50 shadow-lg shadow-purple-500/20"
                      : "bg-white/5 hover:bg-white/10 border-transparent hover:border-purple-400/50"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-2xl">
                      🎯
                    </div>
                    <h3 className="text-xl font-bold text-white">Smart Matching</h3>
                  </div>
                  <p className="text-white/80 mb-4">
                    Match based on your entertainment preferences 
                  </p>
                  <div className="space-y-2 text-sm text-white/60">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>AI-powered compatibility scoring</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Age & location filters applied</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Higher compatibility scores</span>
                    </div>
                  </div>
                </button>

                {/* Age/Location Only Mode */}
                <button
                  onClick={() => handleModeSelection("location")}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 text-left group ${
                    matchingMode === "location"
                      ? "bg-white/10 border-pink-400/50 shadow-lg shadow-pink-500/20"
                      : "bg-white/5 hover:bg-white/10 border-transparent hover:border-pink-400/50"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-2xl">
                      📍
                    </div>
                    <h3 className="text-xl font-bold text-white">Location-Based</h3>
                  </div>
                  <p className="text-white/80 mb-4">
                    Match based only on age and location preferences. No entertainment preferences considered.
                  </p>
                  <div className="space-y-2 text-sm text-white/60">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Age range matching</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Distance-based filtering</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>More matches available</span>
                    </div>
                  </div>
                </button>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleContinueWithMode}
                  disabled={!matchingMode}
                  className={`w-full px-6 py-3 rounded-xl text-white font-semibold transition-all duration-300 transform shadow-lg ${
                    matchingMode
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 hover:scale-105 hover:shadow-xl cursor-pointer"
                      : "bg-gray-600 cursor-not-allowed opacity-50"
                  }`}
                >
                  Continue with {matchingMode === "location" ? "Location-Based" : "Smart"} Matching →
                </button>
                {matchingMode && (
                  <p className="text-center text-white/50 text-xs mt-3">
                    Selected: <span className="text-white/70 font-semibold">{matchingMode === "location" ? "Location-Based" : "Smart Matching"}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
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
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 rounded-full font-bold text-sm text-white shadow-lg backdrop-blur-sm border border-white/20">
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
