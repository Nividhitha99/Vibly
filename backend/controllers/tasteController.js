const tasteService = require("../services/tasteService");

exports.savePreferences = async (req, res) => {
  try {
    const { userId, movies, music, shows, weights } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    await tasteService.saveTaste(userId, {
      movies,
      music,
      shows,
      tasteWeights: weights
    });

    res.json({ message: "Preferences updated" });
  } catch (error) {
    console.error("Error saving preferences:", error);
    res.status(500).json({ error: "Failed to save preferences" });
  }
};
