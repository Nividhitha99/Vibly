const router = require("express").Router();
const tasteController = require("../controllers/tasteController");

router.post("/save", tasteController.savePreferences);
router.get("/:userId", tasteController.getPreferences);

module.exports = router;
