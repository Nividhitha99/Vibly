import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

function TasteSelector({ label, type, selections, setSelections }) {
  const [input, setInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [mode, setMode] = useState("search"); // "search" or "browse"
  
  // Filter states
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedArtist, setSelectedArtist] = useState(""); // For music
  const [selectedYear, setSelectedYear] = useState(null); // For movies - null means no year filter
  const [yearFilterEnabled, setYearFilterEnabled] = useState(false); // Track if year filter is enabled
  
  // Genre lists
  const [genres, setGenres] = useState([]);
  const [loadingGenres, setLoadingGenres] = useState(false);
  
  const searchTimeoutRef = useRef(null);
  const resultsRef = useRef(null);

  // Common languages
  const languages = [
    { code: "en-US", name: "English (US)" },
    { code: "en-GB", name: "English (UK)" },
    { code: "hi-IN", name: "Hindi" },
    { code: "es-ES", name: "Spanish" },
    { code: "fr-FR", name: "French" },
    { code: "de-DE", name: "German" },
    { code: "ja-JP", name: "Japanese" },
    { code: "ko-KR", name: "Korean" },
    { code: "zh-CN", name: "Chinese" },
    { code: "pt-BR", name: "Portuguese (Brazil)" },
    { code: "it-IT", name: "Italian" },
    { code: "ru-RU", name: "Russian" }
  ];

  // Common regions (ISO 3166-1 alpha-2 codes)
  const regions = [
    { code: "US", name: "United States" },
    { code: "IN", name: "India" },
    { code: "GB", name: "United Kingdom" },
    { code: "CA", name: "Canada" },
    { code: "AU", name: "Australia" },
    { code: "DE", name: "Germany" },
    { code: "FR", name: "France" },
    { code: "JP", name: "Japan" },
    { code: "KR", name: "South Korea" },
    { code: "CN", name: "China" },
    { code: "BR", name: "Brazil" },
    { code: "MX", name: "Mexico" }
  ];

  // Determine API endpoint based on type
  const getSearchEndpoint = useCallback(() => {
    switch (type) {
      case "movies":
        return "http://localhost:5001/api/search/movies";
      case "tv":
        return "http://localhost:5001/api/search/tv";
      case "music":
        return "http://localhost:5001/api/search/artists";
      default:
        return null;
    }
  }, [type]);

  // Load genres on mount
  const loadGenres = useCallback(async () => {
    setLoadingGenres(true);
    try {
      const endpoint = type === "movies" 
        ? "http://localhost:5001/api/search/genres/movies"
        : type === "tv"
        ? "http://localhost:5001/api/search/genres/tv"
        : null;
      
      if (endpoint) {
        const response = await axios.get(endpoint);
        setGenres(response.data.genres || []);
      }
    } catch (error) {
      console.error("Error loading genres:", error);
    } finally {
      setLoadingGenres(false);
    }
  }, [type]);

  useEffect(() => {
    loadGenres();
  }, [loadGenres]);

  // Browse with filters
  const browseWithFilters = useCallback(async () => {
    setIsSearching(true);
    setShowResults(true); // Always show results area in browse mode
    try {
      const endpoint = getSearchEndpoint();
      if (!endpoint) {
        setIsSearching(false);
        return;
      }

      const params = {};
      if (selectedGenre) params.genre = selectedGenre;
      if (selectedLanguage) params.language = selectedLanguage;
      if (selectedRegion) params.region = selectedRegion;
      if (selectedArtist) params.artist = selectedArtist;
      // Only apply year filter if explicitly enabled by user
      if (type === "movies" && yearFilterEnabled && selectedYear) {
        params.year = selectedYear;
      }
      if (type === "music") params.limit = 50;

      console.log("Browsing with params:", params);
      const response = await axios.get(endpoint, { params });
      console.log("Browse results:", response.data.results?.length || 0);
      setSearchResults(response.data.results || []);
    } catch (error) {
      console.error("Browse error:", error);
      console.error("Error details:", error.response?.data);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [getSearchEndpoint, selectedGenre, selectedLanguage, selectedRegion, selectedArtist, selectedYear, type, yearFilterEnabled]);

  // Search with debounce
  useEffect(() => {
    if (mode !== "search") return;
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (input.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const endpoint = getSearchEndpoint();
        if (!endpoint) return;

        const response = await axios.get(endpoint, {
          params: { q: input.trim() }
        });

        setSearchResults(response.data.results || []);
        setShowResults(true);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [input, type, mode, getSearchEndpoint]);

  // Auto-browse when filters change in browse mode
  useEffect(() => {
    if (mode === "browse") {
      // Always fetch when in browse mode (even with no filters, show popular items)
      const timeoutId = setTimeout(() => {
        browseWithFilters();
      }, 300); // Small delay to avoid too many calls
      
      return () => clearTimeout(timeoutId);
    } else {
      // Clear results when switching to search mode
      setSearchResults([]);
      setShowResults(false);
    }
  }, [selectedGenre, selectedLanguage, selectedRegion, selectedYear, selectedArtist, mode, type, yearFilterEnabled, browseWithFilters]);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (item) => {
    const isAlreadySelected = selections.some(
      (sel) => sel.id === item.id && sel.type === item.type
    );

    if (!isAlreadySelected) {
      setSelections([...selections, item]);
    }
    setInput("");
    setShowResults(false);
  };

  const removeSelection = (item) => {
    setSelections(
      selections.filter(
        (sel) => !(sel.id === item.id && sel.type === item.type)
      )
    );
  };

  const handleAdd = () => {
    if (input.trim() === "") return;
    
    if (searchResults.length > 0 && showResults) {
      handleSelect(searchResults[0]);
    } else {
      const newItem = {
        id: Date.now().toString(),
        title: input.trim(),
        name: input.trim(),
        type: type
      };
      
      const isAlreadySelected = selections.some(
        (sel) => (sel.title || sel.name) === newItem.title
      );
      
      if (!isAlreadySelected) {
        setSelections([...selections, newItem]);
        setInput("");
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (mode === "search") {
        handleAdd();
      } else {
        browseWithFilters();
      }
    }
  };

  const clearFilters = () => {
    setSelectedLanguage("");
    setSelectedGenre("");
    setSelectedRegion("");
    setSelectedArtist("");
    setSelectedYear(null);
    setYearFilterEnabled(false);
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg relative" ref={resultsRef}>
      <h2 className="text-xl font-semibold mb-4">{label}</h2>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            setMode("search");
            setSearchResults([]);
            setShowResults(false);
          }}
          className={`px-4 py-2 rounded text-sm font-medium ${
            mode === "search"
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          🔍 Search
        </button>
        <button
          onClick={() => {
            setMode("browse");
            // browseWithFilters will be called by useEffect
          }}
          className={`px-4 py-2 rounded text-sm font-medium ${
            mode === "browse"
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          📋 Browse
        </button>
      </div>

      {/* Filters (Browse Mode) */}
      {mode === "browse" && (
        <div className="mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Language Filter */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Language</label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm"
              >
                <option value="">All Languages</option>
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Genre Filter */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Genre</label>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm"
                disabled={loadingGenres}
              >
                <option value="">All Genres</option>
                {genres.map((genre) => (
                  <option key={genre.id} value={genre.id}>
                    {genre.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Region Filter (Movies & Music) */}
            {(type === "movies" || type === "music") && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Region</label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm"
                >
                  <option value="">All Regions</option>
                  {regions.map((region) => (
                    <option key={region.code} value={region.code}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Artist Filter (Music only) */}
            {type === "music" && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Artist</label>
                <input
                  type="text"
                  value={selectedArtist}
                  onChange={(e) => setSelectedArtist(e.target.value)}
                  placeholder="Filter by artist..."
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm"
                />
              </div>
            )}
          </div>

          {/* Year Slider (Movies only) */}
          {type === "movies" && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={yearFilterEnabled}
                  onChange={(e) => {
                    setYearFilterEnabled(e.target.checked);
                    if (e.target.checked && !selectedYear) {
                      setSelectedYear(new Date().getFullYear());
                    }
                  }}
                  className="w-4 h-4"
                />
                <label className="text-sm text-gray-400">
                  Filter by Year {yearFilterEnabled && selectedYear && `(${selectedYear})`}
                </label>
              </div>
              {yearFilterEnabled && (
                <>
                  <input
                    type="range"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={selectedYear || new Date().getFullYear()}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((selectedYear || new Date().getFullYear() - 1900) / (new Date().getFullYear() - 1900)) * 100}%, #374151 ${((selectedYear || new Date().getFullYear() - 1900) / (new Date().getFullYear() - 1900)) * 100}%, #374151 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1900</span>
                    <span className="font-semibold">{selectedYear || new Date().getFullYear()}</span>
                    <span>{new Date().getFullYear()}</span>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={browseWithFilters}
              className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 text-white font-semibold text-sm"
            >
              🔍 Browse
            </button>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-400 hover:text-white px-4 py-2"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Search Input (Search Mode) */}
      {mode === "search" && (
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <input
              className="w-full px-3 py-2 bg-gray-700 text-white rounded"
              placeholder="Search and select..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (searchResults.length > 0) setShowResults(true);
              }}
            />

            {isSearching && (
              <div className="absolute right-3 top-2 text-gray-400 text-sm">
                Searching...
              </div>
            )}
          </div>
          
          <button
            onClick={handleAdd}
            className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 text-white font-semibold"
          >
            Add
          </button>
        </div>
      )}

      {/* Results Display - Netflix/Prime Style Grid */}
      {(mode === "browse" || (mode === "search" && showResults)) && (
        <div className="mt-6">
          {isSearching && (
            <div className="text-center text-gray-400 py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2">Loading...</p>
            </div>
          )}
          
          {!isSearching && searchResults.length > 0 && (
            <div className="w-full">
              <h3 className="text-white font-semibold text-lg mb-4">
                {mode === "browse" ? "Browse Results" : "Search Results"} ({searchResults.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 overflow-y-auto max-h-[600px] pr-2">
                {searchResults.map((item, index) => {
                  const isSelected = selections.some(
                    (sel) => sel.id === item.id && sel.type === item.type
                  );
                  
                  return (
                    <div
                      key={`${item.id}-${index}`}
                      onClick={() => handleSelect(item)}
                      className={`
                        relative group cursor-pointer transform transition-all duration-200
                        ${isSelected 
                          ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-800 scale-95' 
                          : 'hover:scale-105 hover:z-10'
                        }
                      `}
                    >
                      {/* Card Container */}
                      <div className="bg-gray-700 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                        {/* Poster/Image */}
                        <div className="relative aspect-[2/3] bg-gray-800 overflow-hidden">
                          {item.posterPath || item.imageUrl ? (
                            <img
                              src={item.posterPath || item.imageUrl}
                              alt={item.title || item.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div 
                            className={`w-full h-full flex items-center justify-center text-gray-400 text-4xl ${
                              item.posterPath || item.imageUrl ? 'hidden' : ''
                            }`}
                            style={{ backgroundColor: '#1f2937' }}
                          >
                            {type === "music" ? "🎵" : "🎬"}
                          </div>
                          
                          {/* Overlay on Hover */}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              {isSelected ? (
                                <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                  ✓ Added
                                </div>
                              ) : (
                                <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                  + Add
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Selected Badge */}
                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                              ✓
                            </div>
                          )}
                        </div>
                        
                        {/* Title and Info */}
                        <div className="p-2">
                          <div className="text-white font-semibold text-sm truncate mb-1">
                            {item.title || item.name}
                          </div>
                          <div className="text-xs text-gray-400 space-y-0.5">
                            {item.releaseDate && (
                              <div>{new Date(item.releaseDate).getFullYear()}</div>
                            )}
                            {item.firstAirDate && (
                              <div>{new Date(item.firstAirDate).getFullYear()}</div>
                            )}
                            {item.artists && item.artists.length > 0 && (
                              <div className="truncate">
                                {item.artists.map((a) => a.name).join(", ")}
                              </div>
                            )}
                            {item.genres && item.genres.length > 0 && (
                              <div className="truncate text-gray-500">
                                {item.genres.slice(0, 2).join(", ")}
                              </div>
                            )}
                            {item.voteAverage && (
                              <div className="flex items-center gap-1">
                                <span>⭐</span>
                                <span>{item.voteAverage.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {!isSearching && searchResults.length === 0 && (
            <div className="bg-gray-700 rounded-lg p-8 text-gray-400 text-center">
              <div className="text-4xl mb-2">🔍</div>
              <p className="text-sm">
                {mode === "browse" 
                  ? "No results found. Try adjusting your filters or select different options."
                  : "No results found. Try a different search term."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Selected Items - Grid View */}
      {selections.length > 0 && (
        <div className="mt-6">
          <h3 className="text-white font-semibold text-lg mb-4">
            Your Selections ({selections.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {selections.map((item, index) => (
              <div
                key={`selected-${item.id}-${index}`}
                className="relative group"
              >
                <div className="bg-gray-700 rounded-lg overflow-hidden shadow-lg ring-2 ring-blue-500">
                  {/* Poster/Image */}
                  <div className="relative aspect-[2/3] bg-gray-800 overflow-hidden">
                    {item.posterPath || item.imageUrl ? (
                      <img
                        src={item.posterPath || item.imageUrl}
                        alt={item.title || item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-full h-full flex items-center justify-center text-gray-400 text-4xl ${
                        item.posterPath || item.imageUrl ? 'hidden' : ''
                      }`}
                      style={{ backgroundColor: '#1f2937' }}
                    >
                      {type === "music" ? "🎵" : "🎬"}
                    </div>
                    
                    {/* Remove Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSelection(item);
                      }}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold transition-colors"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                  
                  {/* Title */}
                  <div className="p-2">
                    <div className="text-white font-semibold text-sm truncate">
                      {item.title || item.name}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TasteSelector;
