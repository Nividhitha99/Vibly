// OpenAI API Configuration
// Get your API key from https://platform.openai.com/api-keys
const OPENAI_KEY = process.env.OPENAI_KEY || "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";

const { OpenAI } = require("openai");
const getDb = require("../utils/db");

// Initialize OpenAI Client
const client = new OpenAI({
  apiKey: OPENAI_KEY
});

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
    const text = combineTaste(movies, music, shows);

    // Skip if text is empty or too short
    if (!text || text.trim().length < 3) {
      console.log(`Skipping embedding generation - text too short: "${text}"`);
      return null;
    }

    console.log("Generating embedding for:", text);

    const response = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: text
    });

    if (!response || !response.data || !response.data[0] || !response.data[0].embedding) {
      throw new Error("Invalid response from OpenAI API");
    }

    const vector = response.data[0].embedding;

    // Save embedding in LowDB
    const db = await getDb();
    const existing = db.data.embeddings.find(e => e.userId === userId);

    if (existing) {
      existing.vector = vector;
    } else {
      db.data.embeddings.push({
        userId,
        vector
      });
    }

    await db.write();

    console.log(`Embedding saved successfully for user ${userId}`);
    return vector;

  } catch (error) {
    console.error("Embedding generation error:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    if (error.response) {
      console.error("OpenAI API response:", error.response.status, error.response.data);
    }
    // Don't throw - let the caller handle it
    throw error;
  }
};
