const router = require("express").Router();
const controller = require("../controllers/jamController");

router.post("/invite", controller.sendInvite);
router.post("/accept", controller.acceptInvite);

module.exports = router;

