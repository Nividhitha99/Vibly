// HARD-CODE YOUR OPENAI KEY HERE (locally only)
const OPENAI_KEY = "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";  

const { OpenAI } = require("openai");
const getDb = require("../utils/db");

// Initialize OpenAI Client
const client = new OpenAI({
  apiKey: OPENAI_KEY
});

// Combine taste into meaningful string
function combineTaste(movies, music, shows) {
  const m = movies?.join(", ") || "";
  const mu = music?.join(", ") || "";
  const s = shows?.join(", ") || "";

  return `Movies: ${m}. Music: ${mu}. TV Shows: ${s}.`;
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
