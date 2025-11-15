const axios = require("axios");

// Spotify API Configuration
// Get your credentials from https://developer.spotify.com/dashboard
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || "YOUR_SPOTIFY_CLIENT_ID_HERE";
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || "YOUR_SPOTIFY_CLIENT_SECRET_HERE";

let accessToken = null;
let tokenExpiry = 0;

/**
 * Get Spotify access token using Client Credentials flow
 */
async function getAccessToken() {
  // Return cached token if still valid
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      "grant_type=client_credentials",
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`
        }
      }
    );

    accessToken = response.data.access_token;
    // Set expiry to 50 minutes (tokens last 1 hour, refresh early)
    tokenExpiry = Date.now() + 50 * 60 * 1000;

    return accessToken;
  } catch (error) {
    console.error("Spotify token error:", error.message);
    if (error.response?.status === 401) {
      throw new Error("Invalid Spotify API credentials. Please check your SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env file.");
    }
    throw new Error("Failed to get Spotify access token");
  }
}

/**
 * Search for artists
 */
exports.searchArtists = async (query) => {
  try {
    const token = await getAccessToken();

    const response = await axios.get("https://api.spotify.com/v1/search", {
      params: {
        q: query,
        type: "artist",
        limit: 20
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response.data.artists.items.map(artist => ({
      id: artist.id,
      name: artist.name,
      genres: artist.genres,
      popularity: artist.popularity,
      imageUrl: artist.images && artist.images.length > 0 ? artist.images[0].url : null,
      followers: artist.followers?.total || 0,
      type: "artist"
    }));
  } catch (error) {
    console.error("Spotify artist search error:", error.message);
    throw error;
  }
};

/**
 * Search for tracks/songs
 */
exports.searchTracks = async (query) => {
  try {
    const token = await getAccessToken();

    const response = await axios.get("https://api.spotify.com/v1/search", {
      params: {
        q: query,
        type: "track",
        limit: 20
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response.data.tracks.items.map(track => ({
      id: track.id,
      name: track.name,
      artists: track.artists.map(a => ({ id: a.id, name: a.name })),
      album: {
        id: track.album.id,
        name: track.album.name,
        imageUrl: track.album.images && track.album.images.length > 0 ? track.album.images[0].url : null
      },
      popularity: track.popularity,
      previewUrl: track.preview_url,
      durationMs: track.duration_ms,
      type: "track"
    }));
  } catch (error) {
    console.error("Spotify track search error:", error.message);
    throw error;
  }
};

/**
 * Get artist details by ID
 */
exports.getArtistDetails = async (artistId) => {
  try {
    const token = await getAccessToken();

    const response = await axios.get(`https://api.spotify.com/v1/artists/${artistId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return {
      id: response.data.id,
      name: response.data.name,
      genres: response.data.genres,
      popularity: response.data.popularity,
      imageUrl: response.data.images && response.data.images.length > 0 ? response.data.images[0].url : null,
      followers: response.data.followers?.total || 0,
      type: "artist"
    };
  } catch (error) {
    console.error("Spotify artist details error:", error.message);
    throw error;
  }
};

/**
 * Discover artists with filters (genre-based)
 */
exports.discoverArtists = async (filters = {}) => {
  try {
    const token = await getAccessToken();
    
    // Build search query
    let query = "";
    
    // If genre filter, search by genre
    if (filters.genre) {
      query = `genre:"${filters.genre}"`;
    } 
    // If artist filter, search by artist name
    else if (filters.artist && filters.artist.trim()) {
      query = filters.artist.trim();
    }
    // If no filters, get popular artists by searching a popular genre
    else {
      // Search for popular artists using a popular genre
      // Spotify search works best with genre queries
      query = 'genre:"pop"'; // Pop genre typically has the most artists
    }

    console.log("Spotify discover query:", query);

    const response = await axios.get("https://api.spotify.com/v1/search", {
      params: {
        q: query,
        type: "artist",
        limit: Math.min(filters.limit || 50, 50) // Spotify max is 50
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.data || !response.data.artists || !response.data.artists.items) {
      console.log("Spotify API returned unexpected format");
      return [];
    }

    let results = response.data.artists.items
      .filter(artist => {
        // Always include artists, even without genres (unless genre filter is set)
        if (filters.genre && (!artist.genres || artist.genres.length === 0)) {
          return false;
        }
        return true;
      })
      .map(artist => ({
        id: artist.id,
        name: artist.name,
        genres: artist.genres || [],
        popularity: artist.popularity || 0,
        imageUrl: artist.images && artist.images.length > 0 ? artist.images[0].url : null,
        followers: artist.followers?.total || 0,
        type: "artist"
      }))
      .sort((a, b) => b.popularity - a.popularity); // Sort by popularity

    // If genre filter is applied, further filter results to ensure they match
    if (filters.genre) {
      const genreLower = filters.genre.toLowerCase();
      results = results.filter(artist => 
        artist.genres && artist.genres.some(g => g.toLowerCase().includes(genreLower))
      );
    }

    console.log(`Spotify discover: Found ${results.length} artists`);
    return results.slice(0, filters.limit || 50);
  } catch (error) {
    console.error("Spotify discover artists error:", error.message);
    if (error.response) {
      console.error("Spotify API response:", error.response.status, error.response.data);
    }
    // Fallback: return empty array instead of throwing
    return [];
  }
};

