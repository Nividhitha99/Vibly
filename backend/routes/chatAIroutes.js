const router = require("express").Router();
const controller = require("../controllers/chatAIController");

router.post("/enhance", controller.enhanceChat);
router.post("/moderate", controller.moderateMessage);

module.exports = router;
