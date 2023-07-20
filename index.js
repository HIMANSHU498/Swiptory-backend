const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/Users");
const Story = require("./models/Story");
const IsAuthenticated = require("./middlewares/IsAuthenticated");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Bookmark = require("./models/Bookmark");
const Like = require("./models/Likes");
const cors = require("cors");
app.use(cors());
dotenv.config();
app.use(express.json());
app.use((err, req, res, next) => {
  res.status(err.satus || 500);
  res.send({
    error: {
      status: err.satus || 500,
      message: err.message,
    },
  });
});
app.get("/", (req, resp) => {
  resp.send("Website working fine");
});
//register api
app.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.json({ error: "All fields are required" });
    }
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.json({ error: "User already exists" });
    }
    const encryptedPassword = await bcrypt.hash(password, 10);
    const userData = new User({
      username,
      password: encryptedPassword,
    });
    const savedUser = await userData.save();
    const jwtToken = jwt.sign({ username }, process.env.SECRET_KEY);
    res.json({ success: "Successfully registered", jwtToken, name: username });
  } catch (error) {
    res.send({ error: "Something went wrong" });
  }
});
//login api
app.post("/api/login", async (req, resp) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return resp.json({ error: "All fields are required" });
    }
    const checkUser = await User.findOne({ username });
    if (checkUser) {
      const checkPassword = await bcrypt.compare(password, checkUser.password);
      if (checkPassword) {
        const jwtToken = jwt.sign({ username }, process.env.SECRET_KEY);
        return resp.status(200).json({
          success: "User logged in successfully",
          jwtToken,
          name: username,
        });
      }
    }
    return resp.json({ error: "Please enter valid username" });
  } catch (error) {
    return resp.json({ error: "something went wrong" });
  }
});
//add story
app.post("/api/addstory", IsAuthenticated, async (req, resp) => {
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
    console.log(storyData);
    const addStory = await storyData.save();

    return resp.json({
      message: "Story uploaded successfully",
      story: addStory,
    });
  } catch (error) {
    return resp.status(500).json({ error: "Internal server error" });
  }
});

//API to  edit story
// API to edit story and slides
app.put("/api/story/edit/:id", IsAuthenticated, async (req, res) => {
  try {
    const storyId = req.params.id;
    const { slides } = req.body;

    const story = await Story.findById(storyId);
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

// API to get stories by category
app.get("/api/stories/:category", async (req, res) => {
  try {
    const category = req.params.category;
    console.log(category);
    const stories = await Story.find({ "slides.category": category });
    console.log(stories);
    res.json({ stories });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
// API to get all categories and their respective stories
app.get("/api/categories", async (req, res) => {
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
app.get("/api/storiesbyuser", IsAuthenticated, async (req, res) => {
  try {
    const loggedInUserId = req.user.username;

    const userStories = await Story.find({ addedbyuser: loggedInUserId });

    res.json({ userStories });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
// api to  like a story
app.post("/api/stories/:storyId/like", IsAuthenticated, async (req, res) => {
  try {
    const loggedInUserId = req.user.username;
    const storyId = req.params.storyId;
    console.log(loggedInUserId);
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

// api to save bookmark
app.post(
  "/api/stories/:storyId/bookmark",
  IsAuthenticated,
  async (req, res) => {
    try {
      const loggedInUserId = req.user.username;
      const storyId = req.params.storyId;

      const existingBookmark = await Bookmark.findOne({
        story: storyId,
        user: loggedInUserId,
      });
      if (existingBookmark) {
        return res.status(400).json({ error: "Story already bookmarked" });
      }
      console.log(existingBookmark);
      await Bookmark.create({
        story: storyId,
        bookmarkedbyuser: loggedInUserId,
      });

      res.json({ message: "Story bookmarked successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// api to get all the bookmark stories by user
app.get("/api/bookmarks", IsAuthenticated, async (req, res) => {
  try {
    const loggedInUserId = req.user.username;

    const bookmarks = await Bookmark.find({ bookmarkedbyuser: loggedInUserId });
    const storyIds = bookmarks.map((bookmark) => bookmark.story);
    console.log(storyIds);

    Story.findOne({ "slides._id": storyIds }, { "slides.$": 1 })
      .then((story) => {
        if (story) {
          const slide = story.slides[0];
          res.json(slide);
        } else {
          res.json({ error: "Slide not found" });
        }
      })
      .catch((error) => {
        console.error(error);
      });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// connect mongodb
app.listen(process.env.PORT, () => {
  mongoose
    .connect(process.env.MONGODB_URL)
    .then(() => console.log("MongoDB server running successfully"))
    .catch((err) => console.log(err));
  console.log("Server running successfully");
});
