const mongoose = require("mongoose");

const slideSchema = new mongoose.Schema({
  slideHeading: {
    type: String,
    required: true,
  },
  slideDescription: {
    type: String,
    required: true,
  },
  slideImageUrl: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ["food", "health and fitness", "travel", "movies", "education"],
    required: true,
  },
});

const storySchema = new mongoose.Schema({
  slides: [slideSchema],

  addedbyuser: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Story", storySchema);
