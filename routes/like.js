const express = require("express");
const router = express.Router();
const Story = require("../models/Story");
const Like = require("../models/Likes");
const IsAuthenticated = require("../middlewares/IsAuthenticated");

// api to  like a story
router.post("/:storyId", IsAuthenticated, async (req, res) => {
  try {
    const loggedInUserId = req.user.username;
    const storyId = req.params.storyId;

    const existingLike = await Like.findOne({
      story: storyId,
      likedbyuser: loggedInUserId,
    });

    if (existingLike) {
      await Like.deleteOne({ _id: existingLike._id });
      return res.json({ message: "Story like removed successfully" });
    } else {
      await Like.create({ story: storyId, likedbyuser: loggedInUserId });

      return res.json({ message: "Story liked successfully" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

//to get total likes
router.get("/:id", async (req, res) => {
  try {
    const storyId = req.params.id;

    const likeCount = await Like.countDocuments({ story: storyId });

    res.json({ likes: likeCount });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
router.get("/:id/isliked", IsAuthenticated, async (req, res) => {
  try {
    const storyId = req.params.id;
    const loggedInUserId = req.user.username;
    const like = await Like.findOne({
      story: storyId,
      likedbyuser: loggedInUserId,
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
