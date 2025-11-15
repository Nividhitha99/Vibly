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
