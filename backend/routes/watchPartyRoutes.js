const router = require("express").Router();
const controller = require("../controllers/watchPartyController");

router.post("/start", controller.startWatchParty);
router.post("/join", controller.joinWatchPartyByCode);

module.exports = router;

