// HARD-CODE YOUR OPENAI KEY HERE (locally only)
const OPENAI_KEY = "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";  

const { OpenAI } = require("openai");
const db = require("../utils/db");

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

    console.log("Generating embedding for:", text);

    const response = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: text
    });

    const vector = response.data[0].embedding;

    // Save embedding in LowDB
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

    return vector;

  } catch (error) {
    console.log("Embedding generation error:", error);
    throw error;
  }
};
