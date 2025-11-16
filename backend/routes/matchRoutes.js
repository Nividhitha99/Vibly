const router = require("express").Router();
const matchingService = require("../services/matchingService");
const matchController = require("../controllers/matchController");

// Get potential matches (for swiping)
// Query param: ?mode=preferences (default) or ?mode=location
router.get("/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const mode = req.query.mode || "preferences"; // "preferences" or "location"
    console.log(`[MatchRoutes] Getting matches for user ${userId} with mode: ${mode}`);
    const matches = await matchingService.getMatches(userId, mode);
    res.json({
      count: matches.length,
      matches,
      mode: mode
    });
  } catch (err) {
    console.error("Error getting matches:", err);
    res.status(500).json({ error: "Failed to get matches" });
  }
});

// Get confirmed matches (for My Matches page)
router.get("/confirmed/:userId", matchController.getConfirmedMatches);

module.exports = router;
