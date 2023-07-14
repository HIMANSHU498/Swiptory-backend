const mongoose = require("mongoose");
let storySchema = new mongoose.Schema({
  heading: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ["food", "health and fitness", "travel", "movies", "education"],
    required: true,
  },
  addedbyuser: {
    type: String,
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model("story", storySchema);
