const express = require("express");
const router = express.Router();
const Story = require("../models/Story");
const mongoose = require("mongoose");
const Bookmark = require("../models/Bookmark");
const IsAuthenticated = require("../middlewares/IsAuthenticated");

// api to save bookmark
router.post("/:storyId", IsAuthenticated, async (req, res) => {
  try {
    const loggedInUserId = req.user.username;
    const storyId = req.params.storyId;

    const existingBookmark = await Bookmark.findOne({
      story: storyId,
      bookmarkedbyuser: loggedInUserId,
    });

    if (existingBookmark) {
      await Bookmark.deleteOne({ _id: existingBookmark._id });
      return res.json({ message: "Story bookmarked removed" });
    } else {
      await Bookmark.create({
        story: storyId,
        bookmarkedbyuser: loggedInUserId,
      });

      return res.json({ message: "Story bookmarked successfully" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// api to get all the bookmark stories by user
router.get("/bookmarkedslides", IsAuthenticated, async (req, res) => {
  try {
    const loggedInUserId = req.user.username;
    const bookmarkedSlides = await Bookmark.find({
      bookmarkedbyuser: loggedInUserId,
    });

    const slideIds = bookmarkedSlides.map((bookmark) => bookmark.story);

    const slidesToReturn = [];

    for (const slideId of slideIds) {
      const matchingSlide = await Story.findOne(
        { "slides._id": slideId },
        { slides: { $elemMatch: { _id: slideId } } }
      );
      if (matchingSlide && matchingSlide.slides.length > 0) {
        slidesToReturn.push(matchingSlide.slides[0]);
      }
    }

    res.json(
      slidesToReturn.length > 0
        ? slidesToReturn
        : { error: "No bookmarked slides found" }
    );
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// API to search a story by its ID
router.get("/:id/isbookmarked", IsAuthenticated, async (req, res) => {
  try {
    const storyId = req.params.id;
    const loggedInUserId = req.user.username;
    const bookmark = await Bookmark.findOne({
      story: storyId,
      bookmarkedbyuser: loggedInUserId,
    });

    if (bookmark) {
      return res.json({ isBookmarked: true });
    }

    res.json({ isBookmarked: false });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
