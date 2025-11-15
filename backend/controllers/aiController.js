const { generateEmbedding } = require("../services/embeddingService");
const { OpenAI } = require("openai");

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_KEY
});

// Controller to generate embedding
exports.generateEmbedding = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) return res.status(400).json({ error: "No text provided" });

    const embedding = await generateEmbedding(text);

    res.json({ embedding });

  } catch (err) {
    console.log("Embedding error:", err);
    res.status(500).json({ error: "Embedding failed" });
  }
};

// Controller to generate conversation starters
exports.generateConversationStarters = async (req, res) => {
  try {
    const { sharedTastes } = req.body;

    if (!sharedTastes) return res.status(400).json({ error: "sharedTastes required" });

    const prompt = `
    Create 3 conversation starters for two people who share the following tastes:
    ${sharedTastes.join(", ")}.
    Make them friendly, fun, and specific to the shared interests.
    `;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an assistant generating engaging conversation starters." },
        { role: "user", content: prompt }
      ]
    });

    const starters = response.choices[0].message.content;

    res.json({ starters });

  } catch (err) {
    console.log("AI Error:", err);
    res.status(500).json({ error: "Conversation starter generation failed" });
  }
};
