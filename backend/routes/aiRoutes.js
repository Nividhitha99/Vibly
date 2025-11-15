const router = require("express").Router();
const aiController = require("../controllers/aiController");

// Generate embedding for a text block
router.post("/embedding", aiController.generateEmbedding);

// Generate AI conversation starters based on shared taste
router.post("/conversation", aiController.generateConversationStarters);

module.exports = router;
