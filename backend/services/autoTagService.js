const { OpenAI } = require("openai");

// Hardcode key locally
const client = new OpenAI({
  apiKey: "YOUR_OPENAI_KEY"
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
