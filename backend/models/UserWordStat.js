const mongoose = require("mongoose");

// Per-user performance tracking for spaced repetition-like weighting.
// Used to bias question selection towards weaker / stale words.
const userWordStatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    word: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Word",
      required: true,
      index: true,
    },
    correctCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    incorrectCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Updated on each question interaction.
    lastSeenAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

userWordStatSchema.index({ user: 1, word: 1 }, { unique: true });

module.exports = mongoose.model("UserWordStat", userWordStatSchema);

