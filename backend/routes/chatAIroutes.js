const router = require("express").Router();
const controller = require("../controllers/chatAIController");

router.post("/enhance", controller.enhanceChat);
router.post("/moderate", controller.moderateMessage);
router.post("/conversation-starters", controller.getConversationStarters);
router.post("/analyze", controller.analyzeChat);
router.post("/flirty-suggestions", controller.getFlirtySuggestions);
router.post("/conflict-resolution", controller.getConflictResolution);

module.exports = router;
