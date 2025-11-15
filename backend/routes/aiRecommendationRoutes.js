const router = require("express").Router();
const controller = require("../controllers/aiRecommendationController");

router.get("/:userId", controller.getRecommendations);

module.exports = router;
