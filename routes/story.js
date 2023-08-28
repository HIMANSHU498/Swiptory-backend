const express = require("express");
const router = express.Router();
const Story = require("../models/Story");
const IsAuthenticated = require("../middlewares/IsAuthenticated");

//addstory api route
router.post("/addstory", IsAuthenticated, async (req, resp) => {
  try {
    const { slides } = req.body;

    for (const slide of slides) {
      if (
        !slide.slideHeading ||
        !slide.slideDescription ||
        !slide.slideImageUrl ||
        !slide.category
      ) {
        return resp.json({ error: "All fields are required " });
      }
    }

    if (slides.length < 3 || slides.length > 6) {
      return resp.json({
        error:
          "A story must have a minimum of 3 slides and a maximum of 6 slides",
      });
    }

    const loggedInUser = req.user.username;

    const storyData = new Story({
      slides: slides.map((slide) => ({ ...slide })),

      addedbyuser: loggedInUser,
    });

    const addStory = await storyData.save();

    return resp.json({
      message: "Story uploaded successfully",
      story: addStory,
    });
  } catch (error) {
    return resp.status(500).json({ error: "Internal server error" });
  }
});
// API to edit story and slides
router.put("/edit/:id", IsAuthenticated, async (req, res) => {
  try {
    const storyId = req.params.id;
    const { slides } = req.body;

    const story = await Story.findOne({ "slides._id": storyId });

    if (!story) {
      return res.json({ error: "Story not found" });
    }
    if (story.addedbyuser !== req.user.username) {
      return res.status(403).json({
        error: "Only the owner can edit the story",
      });
    }

    // Update slides
    const updateSlides = slides.map((slide) => ({
      slideHeading: slide.slideHeading,
      slideDescription: slide.slideDescription,
      slideImageUrl: slide.slideImageUrl,
      category: slide.category,
    }));
    story.slides = updateSlides;

    const updatedStory = await story.save();

    return res.json({
      message: "Story updated successfully",
      story: updatedStory,
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});
// API to get story for edit
router.get("/edit/:id", IsAuthenticated, async (req, res) => {
  try {
    const slideId = req.params.id;

    const story = await Story.findOne({ "slides._id": slideId });

    if (!story) {
      return res.json({ error: "Story not found" });
    }

    return res.json({
      story: story,
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});
// API to get stories by category
router.get("/stories/:category", async (req, res) => {
  try {
    const category = req.params.category;

    const stories = await Story.find({ "slides.category": category });

    res.json({ stories });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
// API to get all categories and their respective stories
router.get("/categories", async (req, res) => {
  try {
    const categories = [
      "food",
      "health and fitness",
      "travel",
      "movies",
      "education",
    ];
    const storiesByCategory = {};

    for (const category of categories) {
      const stories = await Story.find({}).select("slides");
      const filteredStories = stories.filter((story) =>
        story.slides.some((slide) => slide.category === category)
      );
      const filteredSlides = filteredStories.map((story) =>
        story.slides.filter((slide) => slide.category === category)
      );
      storiesByCategory[category] = filteredSlides;
    }

    res.json({ categories: storiesByCategory });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// API to get stories which is added by loggedin user
router.get("/storiesbyuser", IsAuthenticated, async (req, res) => {
  try {
    const loggedInUserId = req.user.username;

    const userStories = await Story.find({ addedbyuser: loggedInUserId });

    res.json({ userStories });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
// API to get a story by storyId or slideId
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const story = await Story.findOne({ _id: id });
    if (story) {
      return res.json({ story });
    }

    const slideStory = await Story.findOne({ "slides._id": id });

    if (slideStory) {
      return res.json({ story: slideStory });
    }

    return res.status(404).json({ error: "Story or Slide not found" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
module.exports = router;
