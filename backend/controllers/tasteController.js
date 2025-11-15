const tasteService = require("../services/tasteService");

exports.savePreferences = async (req, res) => {
  try {
    const { userId, movies, music, shows, weights } = req.body;

    if (!userId) return res.status(400).json({ error: "userId required" });

    await tasteService.saveTaste(userId, {
      movies: movies || [],
      music: music || [],
      shows: shows || [],
      weights: weights || { movies: 0.4, music: 0.4, shows: 0.2 }
    });

    res.json({ message: "Preferences saved successfully" });

  } catch (error) {
    console.log("Taste save error", error);
    res.status(500).json({ error: "Failed to save preferences" });
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
