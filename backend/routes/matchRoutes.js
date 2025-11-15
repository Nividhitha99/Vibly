const router = require("express").Router();
const matchingController = require("../controllers/matchingController");

router.get("/:userId", matchingController.getMatches);

module.exports = router;
