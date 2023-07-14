const mongoose = require("mongoose");

const bookmarkSchema = new mongoose.Schema({
  story: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Story",
    required: true,
  },
  bookmarkedbyuser: {
    type: String,
    ref: "User",
    required: true,
  },
});

const Bookmark = mongoose.model("Bookmark", bookmarkSchema);

module.exports = Bookmark;
