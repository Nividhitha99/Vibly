const getDb = require("../utils/db");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Get Gemini API key (from env or hardcoded)
const GEMINI_KEY = process.env.GEMINI_KEY || "AIzaSyDwAi9MThmlibUi7pjXr2qEi3Kp-shFcMI";

const genAI = new GoogleGenerativeAI(GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

exports.getRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;

    const db = await getDb();
    const tastes = db.data.tastes.find(t => t.userId === userId);
    
    if (!tastes) {
      return res.status(400).json({ error: "Taste data not found" });
    }

    // Ensure arrays exist and have default values
    const movies = Array.isArray(tastes.movies) ? tastes.movies : [];
    const music = Array.isArray(tastes.music) ? tastes.music : [];
    const shows = Array.isArray(tastes.shows) ? tastes.shows : [];
    const languages = Array.isArray(tastes.languages) ? tastes.languages : [];
    const region = tastes.region || "Unknown";

    const prompt = `
Here is a user's entertainment taste profile:

Movies they like:
${movies.length > 0 ? movies.join(", ") : "None specified"}

Music artists they like:
${music.length > 0 ? music.join(", ") : "None specified"}

TV shows they like:
${shows.length > 0 ? shows.join(", ") : "None specified"}

Languages they watch/listen in:
${languages.length > 0 ? languages.join(", ") : "Not specified"}

Region:
${region}

Generate personalized entertainment recommendations:
1. A list of 5 movies they are very likely to enjoy.
2. A list of 5 songs/artists they should explore.
3. A list of 5 TV shows that match their taste.

Rules:
- Recommend based on genre, theme, vibe, and emotional tone.
- Mix Indian + international depending on relevance.
- Avoid recommending things already in their list.
- Return exactly this JSON structure:

{
  "movies": [...],
  "music": [...],
  "shows": [...]
}
    `;

    const result = await model.generateContent(prompt, {
      generationConfig: {
        temperature: 0.9,
        responseMimeType: "application/json"
      }
    });

    const recs = JSON.parse(result.response.text());

    return res.json({
      success: true,
      recommendations: recs
    });

  } catch (error) {
    console.log("Recommendation error:", error);
    res.status(500).json({ error: "Recommendation generation failed" });
  }
};
