const router = require("express").Router();
const controller = require("../controllers/chatController");

router.post("/send", controller.saveMessage);
router.get("/conversations/:userId", controller.getConversations);
router.get("/:roomId", controller.getMessages);

module.exports = router;
