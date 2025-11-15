const router = require("express").Router();

router.post("/signup", (req, res) => {
  res.json({ message: "Signup placeholder" });
});

module.exports = router;
