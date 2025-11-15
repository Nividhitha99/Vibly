const router = require("express").Router();

router.get("/", (req, res) => {
  res.json([{ name: "Mock Match", score: 85 }]);
});

module.exports = router;
