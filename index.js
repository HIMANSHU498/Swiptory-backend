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
          message: "User logged in successfully",
          jwtToken,
          name: username,
        });
      }
    }
    return resp.status(400).json({ message: "Invalid credentials" });
  } catch (error) {
    return resp.json({ error: "something went wrong" });
  }
});
//add story
app.post("/api/addstory", IsAuthenticated, async (req, resp) => {
  try {
    const { heading, description, imageUrl, category } = req.body;
    if (!heading || !description || !imageUrl || !category) {
      return resp.json({ error: "All fields are required" });
    }
    const loggedInUser = req.user.username;
    console.log(loggedInUser);
    const storyData = new Story({
      heading,
      description,
      imageUrl,
      category,
      addedbyuser: loggedInUser,
    });
    const addStory = await storyData.save();
    return resp.json({
      message: "Story uploaded successfully",
    });
  } catch (error) {
    return resp.status(500).json({ error: "Internal server error" });
  }
});
//API to  edit story
app.post("/api/story/edit/:id", IsAuthenticated, async (req, res) => {
  try {
    const storyId = req.params.id;
    const { heading, description, imageUrl, category } = req.body;
    const story = await Story.findById(storyId);
    if (!story) {
      return res.json({ error: "Story not found" });
    }
    if (story.addedbyuser !== req.user.username) {
      return res.status(403).json({
        error: "User can only edit those story which is added by user",
      });
    }
    story.heading = heading;
    story.description = description;
    story.imageUrl = imageUrl;
    story.category = category;
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
    const stories = await Story.find({ category });

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
      const stories = await Story.find({ category });
      storiesByCategory[category] = stories;
    }

    res.json({ storiesByCategory });
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

//api to get all the bookmark stories by user
app.get("/api/bookmarks", IsAuthenticated, async (req, res) => {
  try {
    const loggedInUserId = req.user.username;

    const bookmarks = await Bookmark.find({ bookmarkedbyuser: loggedInUserId });
    console.log(bookmarks);
    const storyIds = bookmarks.map((bookmark) => bookmark.story);

    const stories = await Story.find({ _id: { $in: storyIds } });

    res.json({ bookmarks: stories });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

//connect mongodb
app.listen(process.env.PORT, () => {
  mongoose
    .connect(process.env.MONGODB_URL)
    .then(() => console.log("MongoDB server running successfully"))
    .catch((err) => console.log(err));
  console.log("Server running successfully");
});
