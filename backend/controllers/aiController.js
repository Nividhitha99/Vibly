const embeddingService = require("../services/embeddingService");

exports.createEmbedding = async (req, res) => {
  try {
    const { userId, movies, music, shows } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const vector = await embeddingService.generateEmbedding(
      userId,
      movies || [],
      music || [],
      shows || []
    );

    res.json({
      message: "Embedding generated",
      vectorLength: vector.length
    });

  } catch (error) {
    res.status(500).json({ error: "Embedding generation failed" });
  }
};
