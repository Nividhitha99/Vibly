const router = require("express").Router();
const controller = require("../controllers/passController");

router.post("/", controller.passUser);
router.get("/:userId", controller.getPassedUsers);
router.delete("/", controller.undoPass);

module.exports = router;

