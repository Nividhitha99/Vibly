const { GoogleGenerativeAI } = require("@google/generative-ai");

// Get Gemini API key (from env or hardcoded)
const GEMINI_KEY = process.env.GEMINI_KEY || "AIzaSyDwAi9MThmlibUi7pjXr2qEi3Kp-shFcMI";

const genAI = new GoogleGenerativeAI(GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

    const result = await model.generateContent(prompt, {
      generationConfig: {
        temperature: 0.4,
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(result.response.text());

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
