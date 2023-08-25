const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const dbConnection = require("./config/dbconnection.js");
const authRoutes = require("./routes/auth");
const storyRoutes = require("./routes/story");
const bookmarkRoutes = require("./routes/bookmark");
const likeRoutes = require("./routes/like");
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
dotenv.config();
app.use(express.json());

app.get("/", (req, resp) => {
  resp.status(200).json("Server is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/story", storyRoutes);
app.use("/api/story/bookmark", bookmarkRoutes);
app.use("/api/story/like", likeRoutes);

// connect to server
app.listen(process.env.PORT, () => {
  dbConnection();
  console.log(`Server is running successfully on port ${process.env.PORT}`);
});
