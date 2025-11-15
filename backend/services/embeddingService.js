// Google Gemini API Configuration
const GEMINI_KEY = process.env.GEMINI_KEY || "AIzaSyDwAi9MThmlibUi7pjXr2qEi3Kp-shFcMI";

const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");
const getDb = require("../utils/db");
const psychologicalProfileService = require("./psychologicalProfileService");

// Initialize Gemini Client
const genAI = new GoogleGenerativeAI(GEMINI_KEY);

// Combine taste into meaningful string (handles both string and object formats)
function combineTaste(movies, music, shows) {
  // Handle movies - extract titles from objects or use strings
  const movieTitles = (movies || []).map(m => {
    if (typeof m === 'object' && m.title) return m.title;
    if (typeof m === 'object' && m.name) return m.name;
    return String(m);
  });
  const m = movieTitles.join(", ") || "";

  // Handle music - extract names from objects or use strings
  const musicNames = (music || []).map(mu => {
    if (typeof mu === 'object' && mu.name) return mu.name;
    if (typeof mu === 'object' && mu.title) return mu.title;
    return String(mu);
  });
  const mu = musicNames.join(", ") || "";

  // Handle shows - extract titles from objects or use strings
  const showTitles = (shows || []).map(s => {
    if (typeof s === 'object' && s.title) return s.title;
    if (typeof s === 'object' && s.name) return s.name;
    return String(s);
  });
  const s = showTitles.join(", ") || "";

  // Also include genres if available for better embedding
  const movieGenres = (movies || [])
    .filter(m => typeof m === 'object' && m.genres)
    .flatMap(m => m.genres || [])
    .filter((v, i, a) => a.indexOf(v) === i); // unique

  const musicGenres = (music || [])
    .filter(m => typeof m === 'object' && m.genres)
    .flatMap(m => m.genres || [])
    .filter((v, i, a) => a.indexOf(v) === i); // unique

  const genreText = movieGenres.length > 0 || musicGenres.length > 0
    ? ` Genres: ${[...movieGenres, ...musicGenres].join(", ")}.`
    : "";

  return `Movies: ${m}. Music: ${mu}. TV Shows: ${s}.${genreText}`;
}

exports.generateEmbedding = async (userId, movies, music, shows) => {
  try {
    // Use psychological profiling to generate richer embedding text
    // This includes both content (titles, genres) and psychological meaning
    console.log(`[Embedding] 🧠 Generating psychological profile for user ${userId}...`);
    console.log(`[Embedding] Calling Gemini API for psychological analysis...`);
    const psychologicalText = await psychologicalProfileService.generatePsychologicalEmbeddingText(movies, music, shows);
    console.log(`[Embedding] ✅ Psychological analysis complete, text length: ${psychologicalText?.length || 0}`);
    
    // Fallback to basic text if psychological analysis fails
    const text = psychologicalText || combineTaste(movies, music, shows);

    // Skip if text is empty or too short
    if (!text || text.trim().length < 3) {
      console.log(`Skipping embedding generation - text too short: "${text}"`);
      return null;
    }

    console.log("[Embedding] 📊 Generating embedding with psychological insights...");
    console.log("[Embedding] Text preview:", text.substring(0, 200) + "...");

    // Use Gemini Embedding API via REST
    console.log(`[Gemini API] 🔗 Calling Gemini Embedding API (text-embedding-004)...`);
    const embeddingResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_KEY}`,
      {
        model: "models/text-embedding-004",
        content: {
          parts: [{ text: text }]
        }
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    if (!embeddingResponse || !embeddingResponse.data || !embeddingResponse.data.embedding || !embeddingResponse.data.embedding.values) {
      throw new Error("Invalid response from Gemini API");
    }

    console.log(`[Gemini API] ✅ Embedding API call successful! Vector dimension: ${embeddingResponse.data.embedding.values.length}`);
    const vector = embeddingResponse.data.embedding.values;

    // Save embedding in LowDB
    const db = await getDb();
    const existing = db.data.embeddings.find(e => e.userId === userId);

    // Also save the psychological profile for reference
    const psychologicalProfile = await psychologicalProfileService.analyzePsychologicalProfile(movies, music, shows);
    
    // Update or create embedding entry with psychological profile
    if (existing) {
      existing.vector = vector;
      existing.psychologicalProfile = psychologicalProfile;
      existing.lastUpdated = new Date().toISOString();
    } else {
      db.data.embeddings.push({
        userId,
        vector,
        psychologicalProfile: psychologicalProfile,
        lastUpdated: new Date().toISOString()
      });
    }

    await db.write();

    console.log(`[Embedding] Saved successfully for user ${userId} with ${psychologicalProfile.traits?.length || 0} psychological traits`);
    return vector;

  } catch (error) {
    console.error("Embedding generation error:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    if (error.response) {
      console.error("Gemini API response:", error.response.status, error.response.data);
    }
    // Don't throw - let the caller handle it
    throw error;
  }
};
