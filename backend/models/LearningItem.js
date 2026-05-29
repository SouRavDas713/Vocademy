const mongoose = require("mongoose");

const learningItemSchema = new mongoose.Schema(
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
  },
  { timestamps: true },
);

learningItemSchema.index({ user: 1, word: 1 }, { unique: true });

module.exports = mongoose.model("LearningItem", learningItemSchema);
