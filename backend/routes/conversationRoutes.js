const router = require("express").Router();
const controller = require("../controllers/conversationController");

router.post("/starter", controller.getConversationStarters);

module.exports = router;
