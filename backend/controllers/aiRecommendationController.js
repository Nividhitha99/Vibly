const getDb = require("../utils/db");
const { OpenAI } = require("openai");

// Get OpenAI API key (from env or hardcoded)
const OPENAI_KEY = process.env.OPENAI_KEY || "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";

const client = new OpenAI({
  apiKey: OPENAI_KEY
});

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

    const result = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.9
    });

    const recs = JSON.parse(result.choices[0].message.content);

    return res.json({
      success: true,
      recommendations: recs
    });

  } catch (error) {
    console.log("Recommendation error:", error);
    res.status(500).json({ error: "Recommendation generation failed" });
  }
};
