const tasteService = require("../services/tasteService");
const embeddingCalculationService = require("../services/embeddingCalculationService");

exports.savePreferences = async (req, res) => {
  try {
    // Get userId from body or from localStorage (sent as header or body)
    let { userId, movies, music, shows, tv, weights } = req.body;

    // If userId not in body, try to get from query or header
    if (!userId) {
      userId = req.query.userId || req.headers['x-user-id'];
    }

    // If still no userId, try to get from localStorage via a different approach
    // For now, we'll require it in the body
    if (!userId) {
      return res.status(400).json({ error: "userId required. Please include userId in request body or send it from localStorage." });
    }

    // Map 'tv' to 'shows' if frontend sends 'tv'
    if (tv && !shows) {
      shows = tv;
    }

    const moviesArray = movies || [];
    const musicArray = music || [];
    const showsArray = shows || [];

    // Save taste preferences
    await tasteService.saveTaste(userId, {
      movies: moviesArray,
      music: musicArray,
      shows: showsArray,
      weights: weights || { movies: 0.4, music: 0.4, shows: 0.2 }
    });

    // Automatically calculate embedding after saving preferences
    // This ensures the user will have matches
    const hasPreferences = moviesArray.length > 0 || musicArray.length > 0 || showsArray.length > 0;
    if (hasPreferences) {
      console.log(`[TasteController] Calculating embedding for user ${userId} with ${moviesArray.length} movies, ${musicArray.length} music, ${showsArray.length} shows`);
      // Use the embedding calculation service which handles all edge cases
      embeddingCalculationService.ensureEmbeddingForUser(userId);
    } else {
      console.log(`[TasteController] Skipping embedding calculation for user ${userId} - no preferences provided`);
    }

    res.json({ message: "Preferences saved successfully" });

  } catch (error) {
    console.error("Taste save error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      error: "Failed to save preferences",
      details: error.message 
    });
  }
};

exports.getPreferences = async (req, res) => {
  try {
    const data = await tasteService.getTaste(req.params.userId);

    if (!data) return res.status(404).json({ error: "No preferences found" });

    res.json(data);

  } catch (error) {
    res.status(500).json({ error: "Failed to fetch preferences" });
  }
};
