const express = require("express");
const router = express.Router();
const Story = require("../models/Story");
const Like = require("../models/Likes");
const IsAuthenticated = require("../middlewares/IsAuthenticated");

// api to  like a story
router.post("/:storyId/like", IsAuthenticated, async (req, res) => {
  try {
    const loggedInUserId = req.user.username;
    const storyId = req.params.storyId;

    const existingLike = await Like.findOne({
      story: storyId,
      user: loggedInUserId,
    });
    if (existingLike) {
      return res.status(400).json({ error: "Story already liked" });
    }

    await Like.create({ story: storyId, likedbyuser: loggedInUserId });

    res.json({ message: "Story liked successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

//to get likes
router.get("/:id/likes", async (req, res) => {
  try {
    const storyId = req.params.id;

    // Count the number of likes for the given story ID
    const likeCount = await Like.countDocuments({ story: storyId });

    res.json({ likes: likeCount });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
router.get("/:id/isliked", async (req, res) => {
  try {
    const storyId = req.params.id;

    const like = await Like.findOne({
      story: storyId,
    });

    if (like) {
      return res.json({ isLiked: true });
    }

    res.json({ isLiked: false });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
