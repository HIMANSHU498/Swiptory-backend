const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const MONGODB_URL = process.env.MONGODB_URL;
const connection = async () => {
  try {
    await mongoose.connect(MONGODB_URL, {
      useNewUrlParser: true,

      useUnifiedTopology: true,
    });
    console.log("Connected to the database successfully");
  } catch (error) {
    console.log(error, "connection failed to db");
  }
};

module.exports = connection;
