const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/Users");
const dotenv = require("dotenv");
dotenv.config();

//register route
router.post("/register", async (req, res) => {
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
    res.json({
      success: "Successfully registered",
      jwtToken,
      name: username,
    });
  } catch (error) {
    res.send({ error: "Something went wrong" });
  }
});

//login route
router.post("/login", async (req, resp) => {
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

module.exports = router;
