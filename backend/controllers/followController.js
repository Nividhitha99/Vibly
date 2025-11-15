const getDb = require("../utils/db");

exports.followUser = async (req, res) => {
  try {
    const { followerId, followingId } = req.body;

    if (!followerId || !followingId) {
      return res.status(400).json({ error: "followerId and followingId are required" });
    }

    if (followerId === followingId) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }

    const db = await getDb();
    
    // Initialize followers array if it doesn't exist
    if (!db.data.followers) {
      db.data.followers = [];
    }

    // Check if already following
    const existing = db.data.followers.find(
      f => f.followerId === followerId && f.followingId === followingId
    );

    if (existing) {
      return res.json({ message: "Already following", following: true });
    }

    // Add follow relationship
    db.data.followers.push({
      followerId,
      followingId,
      createdAt: Date.now()
    });

    await db.write();

    res.json({ message: "Successfully followed user", following: true });
  } catch (err) {
    console.error("Follow error:", err);
    res.status(500).json({ error: "Failed to follow user" });
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    const { followerId, followingId } = req.body;

    if (!followerId || !followingId) {
      return res.status(400).json({ error: "followerId and followingId are required" });
    }

    const db = await getDb();
    
    if (!db.data.followers) {
      db.data.followers = [];
    }

    // Remove follow relationship
    const index = db.data.followers.findIndex(
      f => f.followerId === followerId && f.followingId === followingId
    );

    if (index === -1) {
      return res.json({ message: "Not following this user", following: false });
    }

    db.data.followers.splice(index, 1);
    await db.write();

    res.json({ message: "Successfully unfollowed user", following: false });
  } catch (err) {
    console.error("Unfollow error:", err);
    res.status(500).json({ error: "Failed to unfollow user" });
  }
};

exports.getFollowStatus = async (req, res) => {
  try {
    const { followerId, followingId } = req.query;

    if (!followerId || !followingId) {
      return res.status(400).json({ error: "followerId and followingId are required" });
    }

    const db = await getDb();
    
    if (!db.data.followers) {
      db.data.followers = [];
    }

    const isFollowing = db.data.followers.some(
      f => f.followerId === followerId && f.followingId === followingId
    );

    res.json({ following: isFollowing });
  } catch (err) {
    console.error("Get follow status error:", err);
    res.status(500).json({ error: "Failed to get follow status" });
  }
};

exports.getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;

    const db = await getDb();
    
    if (!db.data.followers) {
      db.data.followers = [];
    }

    const followers = db.data.followers
      .filter(f => f.followingId === userId)
      .map(f => f.followerId);

    // Get user details for each follower
    const followerUsers = followers.map(followerId => {
      const user = db.data.users.find(u => u.id === followerId);
      if (user) {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }
      return null;
    }).filter(u => u !== null);

    res.json({ followers: followerUsers, count: followerUsers.length });
  } catch (err) {
    console.error("Get followers error:", err);
    res.status(500).json({ error: "Failed to get followers" });
  }
};

exports.getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;

    const db = await getDb();
    
    if (!db.data.followers) {
      db.data.followers = [];
    }

    const following = db.data.followers
      .filter(f => f.followerId === userId)
      .map(f => f.followingId);

    // Get user details for each following
    const followingUsers = following.map(followingId => {
      const user = db.data.users.find(u => u.id === followingId);
      if (user) {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }
      return null;
    }).filter(u => u !== null);

    res.json({ following: followingUsers, count: followingUsers.length });
  } catch (err) {
    console.error("Get following error:", err);
    res.status(500).json({ error: "Failed to get following" });
  }
};

