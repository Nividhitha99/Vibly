const getDb = require("../utils/db");
const { OpenAI } = require("openai");

// Get OpenAI API key (from env or hardcoded)
const OPENAI_KEY = process.env.OPENAI_KEY || "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";

const client = new OpenAI({
  apiKey: OPENAI_KEY
});

exports.getConversationStarters = async (req, res) => {
  try {
    const { userId, matchId } = req.body;

    const db = await getDb();
    const allTastes = db.data.tastes;
    const userTaste = allTastes.find(t => t.userId === userId);
    const matchTaste = allTastes.find(t => t.userId === matchId);

    if (!userTaste || !matchTaste) {
      return res.status(400).json({ error: "Taste data missing" });
    }

    // Ensure arrays exist
    const userMovies = Array.isArray(userTaste.movies) ? userTaste.movies : [];
    const userMusic = Array.isArray(userTaste.music) ? userTaste.music : [];
    const userShows = Array.isArray(userTaste.shows) ? userTaste.shows : [];
    const userLanguages = Array.isArray(userTaste.languages) ? userTaste.languages : [];
    
    const matchMovies = Array.isArray(matchTaste.movies) ? matchTaste.movies : [];
    const matchMusic = Array.isArray(matchTaste.music) ? matchTaste.music : [];
    const matchShows = Array.isArray(matchTaste.shows) ? matchTaste.shows : [];
    const matchLanguages = Array.isArray(matchTaste.languages) ? matchTaste.languages : [];

    const prompt = `
Two people have been matched based on entertainment tastes.

User A:
Movies: ${userMovies.length > 0 ? userMovies.join(", ") : "None specified"}
Music: ${userMusic.length > 0 ? userMusic.join(", ") : "None specified"}
Shows: ${userShows.length > 0 ? userShows.join(", ") : "None specified"}
Languages: ${userLanguages.length > 0 ? userLanguages.join(", ") : "Not specified"}
Region: ${userTaste.region || "Unknown"}

User B:
Movies: ${matchMovies.length > 0 ? matchMovies.join(", ") : "None specified"}
Music: ${matchMusic.length > 0 ? matchMusic.join(", ") : "None specified"}
Shows: ${matchShows.length > 0 ? matchShows.join(", ") : "None specified"}
Languages: ${matchLanguages.length > 0 ? matchLanguages.join(", ") : "Not specified"}
Region: ${matchTaste.region || "Unknown"}

Generate 5 unique icebreaker messages that:
- Reference specific overlaps (genres, artists, shows)
- Avoid clichés
- Are short (1–2 sentences)
- Spark conversation
- Include one watch-party idea and one music jam-session idea

Return only a JSON list of messages:
["msg1", "msg2", ...]
    `;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8
    });

    const output = JSON.parse(response.choices[0].message.content);

    res.json({
      success: true,
      starters: output
    });

  } catch (error) {
    console.log("Starter AI Error:", error);
    res.status(500).json({ error: "AI generation failed" });
  }
};
