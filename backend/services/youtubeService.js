const axios = require("axios");

// YouTube Data API v3
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "";
const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3";

/**
 * Search for a YouTube video by query
 * Returns the first video ID that matches the search
 */
exports.searchVideo = async (query) => {
  try {
    if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === "") {
      // Fallback: Try to use a simple YouTube search URL pattern
      // This is a workaround - ideally should have API key
      console.warn("YouTube API key not configured. Using fallback method.");
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
      
      // Try to use YouTube's oEmbed API as a fallback (doesn't require API key for public videos)
      // But we still need a video ID, so this won't work perfectly
      // For now, return error but with a helpful message
      return {
        videoId: null,
        searchUrl: searchUrl,
        error: "YouTube API key not configured. Please set YOUTUBE_API_KEY in .env file. Get a free key from https://console.cloud.google.com/"
      };
    }

    const response = await axios.get(`${YOUTUBE_API_URL}/search`, {
      params: {
        part: "snippet",
        q: query,
        type: "video",
        maxResults: 1,
        key: YOUTUBE_API_KEY
      }
    });

    if (response.data.items && response.data.items.length > 0) {
      const video = response.data.items[0];
      return {
        videoId: video.id.videoId,
        title: video.snippet.title,
        thumbnail: video.snippet.thumbnails.default.url,
        channelTitle: video.snippet.channelTitle
      };
    }

    return {
      videoId: null,
      searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      error: "No video found"
    };
  } catch (error) {
    console.error("YouTube search error:", error.message);
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    return {
      videoId: null,
      searchUrl: searchUrl,
      error: error.message || "Failed to search YouTube"
    };
  }
};

