const router = require("express").Router();
const tasteController = require("../controllers/tasteController");

router.post("/preferences", tasteController.savePreferences);

module.exports = router;
