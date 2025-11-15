const { OpenAI } = require("openai");

// Get OpenAI API key (from env or hardcoded)
const OPENAI_KEY = process.env.OPENAI_KEY || "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";

const client = new OpenAI({
  apiKey: OPENAI_KEY
});

exports.autoTagItem = async (title) => {
  try {
    const prompt = `
Predict entertainment metadata for: "${title}".

Return JSON in this EXACT format:
{
  "genre": "...",
  "language": "...",
  "mood": "...",
  "theme": "..."
}
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4
    });

    return JSON.parse(response.choices[0].message.content);

  } catch (err) {
    console.log("Auto-tagging error:", err);
    return {
      genre: "unknown",
      language: "unknown",
      mood: "unknown",
      theme: "unknown"
    };
  }
};
