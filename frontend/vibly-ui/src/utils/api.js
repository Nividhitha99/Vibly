// API utility functions
const API_BASE_URL = "http://localhost:5001/api";

export const api = {
  // User endpoints
  register: (data) => 
    fetch(`${API_BASE_URL}/user/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((res) => res.json()),

  login: (data) =>
    fetch(`${API_BASE_URL}/user/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((res) => res.json()),

  getUser: (userId) =>
    fetch(`${API_BASE_URL}/user/${userId}`).then((res) => res.json()),

  // Taste/Preferences endpoints
  savePreferences: (data) =>
    fetch(`${API_BASE_URL}/user/preferences`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((res) => res.json()),

  getPreferences: (userId) =>
    fetch(`${API_BASE_URL}/taste/${userId}`).then((res) => res.json()),

  // Match endpoints
  getMatches: (userId) =>
    fetch(`${API_BASE_URL}/match/${userId}`).then((res) => res.json()),

  sendLike: (data) =>
    fetch(`${API_BASE_URL}/match-status/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((res) => res.json()),

  // Search endpoints
  searchMovies: (query) =>
    fetch(`${API_BASE_URL}/search/movies?q=${encodeURIComponent(query)}`).then((res) => res.json()),

  searchTV: (query) =>
    fetch(`${API_BASE_URL}/search/tv?q=${encodeURIComponent(query)}`).then((res) => res.json()),

  searchArtists: (query) =>
    fetch(`${API_BASE_URL}/search/artists?q=${encodeURIComponent(query)}`).then((res) => res.json()),

  // Chat endpoints
  sendMessage: (data) =>
    fetch(`${API_BASE_URL}/chat/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((res) => res.json()),

  getMessages: (roomId) =>
    fetch(`${API_BASE_URL}/chat/${roomId}`).then((res) => res.json()),

  // AI endpoints
  getConversationStarters: (data) =>
    fetch(`${API_BASE_URL}/ai/starter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((res) => res.json()),

  getRecommendations: (userId) =>
    fetch(`${API_BASE_URL}/recommend/${userId}`).then((res) => res.json()),
};

export default api;

