const router = require("express").Router();
const controller = require("../controllers/matchStatusController");

router.post("/like", controller.sendLike);
router.get("/:userId", controller.getMatchStatus);

module.exports = router;
