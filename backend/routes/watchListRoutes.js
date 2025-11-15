const router = require("express").Router();
const controller = require("../controllers/watchlistController");

router.post("/add", controller.addToWatchlist);
router.get("/:userId", controller.getWatchlist);

module.exports = router;
