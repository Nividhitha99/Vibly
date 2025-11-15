const router = require("express").Router();
const controller = require("../controllers/matchSettingsController");

router.get("/:userId", controller.getMatchSettings);
router.put("/:userId", controller.updateMatchSettings);

module.exports = router;

