const mongoose = require("mongoose");

const likeSchema = new mongoose.Schema({
  story: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Story",
    required: true,
  },
  likedbyuser: {
    type: String,
    ref: "User",
    required: true,
  },
});

const Like = mongoose.model("Like", likeSchema);

module.exports = Like;
