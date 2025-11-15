const tasteService = require("../services/tasteService");
const embeddingService = require("../services/embeddingService");

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

    // Generate embedding automatically after saving preferences
    // Only generate if at least one preference is provided
    const hasPreferences = moviesArray.length > 0 || musicArray.length > 0 || showsArray.length > 0;
    if (hasPreferences) {
      console.log(`[TasteController] Generating embedding for user ${userId} with ${moviesArray.length} movies, ${musicArray.length} music, ${showsArray.length} shows`);
      // Run embedding generation asynchronously without blocking the response
      // This prevents the server from crashing if embedding generation fails
      embeddingService.generateEmbedding(userId, moviesArray, musicArray, showsArray)
        .then(() => {
          console.log(`✓ Embedding generated successfully for user ${userId}`);
        })
        .catch((embeddingError) => {
          console.error("✗ Failed to generate embedding (non-fatal):", embeddingError.message);
          console.error("✗ Embedding error stack:", embeddingError.stack);
          // Don't fail the request if embedding generation fails
        });
    } else {
      console.log(`Skipping embedding generation for user ${userId} - no preferences provided`);
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
