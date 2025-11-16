const router = require("express").Router();
const tmdbService = require("../services/tmdbService");
const spotifyService = require("../services/spotifyService");
const youtubeService = require("../services/youtubeService");

// Get movie genres
router.get("/genres/movies", async (req, res) => {
  try {
    const genres = await tmdbService.getMovieGenres();
    res.json({ genres });
  } catch (error) {
    console.error("Get movie genres error:", error);
    res.status(500).json({ error: "Failed to get movie genres" });
  }
});

// Get TV genres
router.get("/genres/tv", async (req, res) => {
  try {
    const genres = await tmdbService.getTVGenres();
    res.json({ genres });
  } catch (error) {
    console.error("Get TV genres error:", error);
    res.status(500).json({ error: "Failed to get TV genres" });
  }
});

// Search movies (with optional query)
router.get("/movies", async (req, res) => {
  try {
    const { q, genre, language, year, region, page } = req.query;
    
    // If query provided, use search. Otherwise, use discover
    if (q && q.trim()) {
      const results = await tmdbService.searchMovies(q);
      res.json({ results });
    } else {
      // Use discover with filters
      const filters = {};
      if (genre) filters.genre = genre;
      if (language) filters.language = language;
      if (year) filters.year = parseInt(year);
      if (region) filters.region = region;
      if (page) filters.page = parseInt(page);
      
      const results = await tmdbService.discoverMovies(filters);
      res.json({ results });
    }
  } catch (error) {
    console.error("Movie search/discover error:", error);
    const statusCode = error.message.includes("not configured") || error.message.includes("Invalid") ? 500 : 500;
    res.status(statusCode).json({ 
      error: error.message || "Failed to search/discover movies",
      details: "Please ensure TMDB_API_KEY is set in your .env file"
    });
  }
});

// Search TV shows (with optional query)
router.get("/tv", async (req, res) => {
  try {
    const { q, genre, language, year, page } = req.query;
    
    // If query provided, use search. Otherwise, use discover
    if (q && q.trim()) {
      const results = await tmdbService.searchTVShows(q);
      res.json({ results });
    } else {
      // Use discover with filters
      const filters = {};
      if (genre) filters.genre = genre;
      if (language) filters.language = language;
      if (year) filters.year = parseInt(year);
      if (page) filters.page = parseInt(page);
      
      const results = await tmdbService.discoverTVShows(filters);
      res.json({ results });
    }
  } catch (error) {
    console.error("TV search/discover error:", error);
    const statusCode = error.message.includes("not configured") || error.message.includes("Invalid") ? 500 : 500;
    res.status(statusCode).json({ 
      error: error.message || "Failed to search/discover TV shows",
      details: "Please ensure TMDB_API_KEY is set in your .env file"
    });
  }
});

// Search artists (with optional query and filters)
router.get("/artists", async (req, res) => {
  try {
    const { q, genre, language, region, artist, limit } = req.query;
    
    // If query provided, use search. Otherwise, use discover
    if (q && q.trim()) {
      const results = await spotifyService.searchArtists(q);
      res.json({ results });
    } else {
      // Use discover with filters
      const filters = {};
      if (genre) filters.genre = genre;
      if (language) filters.language = language;
      if (region) filters.region = region;
      if (artist) filters.artist = artist;
      if (limit) filters.limit = parseInt(limit);
      
      const results = await spotifyService.discoverArtists(filters);
      res.json({ results });
    }
  } catch (error) {
    console.error("Artist search/discover error:", error);
    const statusCode = error.message.includes("not configured") || error.message.includes("Invalid") ? 500 : 500;
    res.status(statusCode).json({ 
      error: error.message || "Failed to search/discover artists",
      details: "Please ensure SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are set in your .env file"
    });
  }
});

// Search tracks
router.get("/tracks", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    const results = await spotifyService.searchTracks(q);
    res.json({ results });
  } catch (error) {
    console.error("Track search error:", error);
    const statusCode = error.message.includes("not configured") || error.message.includes("Invalid") ? 500 : 500;
    res.status(statusCode).json({ 
      error: error.message || "Failed to search tracks",
      details: "Please ensure SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are set in your .env file"
    });
  }
});

// Search YouTube for a video
router.get("/youtube", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    const result = await youtubeService.searchVideo(q);
    res.json(result);
  } catch (error) {
    console.error("YouTube search error:", error);
    res.status(500).json({ 
      error: error.message || "Failed to search YouTube"
    });
  }
});

module.exports = router;

