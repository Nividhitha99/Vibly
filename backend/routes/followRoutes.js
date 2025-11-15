const router = require("express").Router();
const followController = require("../controllers/followController");

router.post("/follow", followController.followUser);
router.post("/unfollow", followController.unfollowUser);
router.get("/status", followController.getFollowStatus);
router.get("/followers/:userId", followController.getFollowers);
router.get("/following/:userId", followController.getFollowing);

module.exports = router;

