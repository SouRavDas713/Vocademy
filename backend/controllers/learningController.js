const LearningItem = require("../models/LearningItem");
const Word = require("../models/Word");
const UserWordStat = require("../models/UserWordStat");

exports.getLearningItems = async (req, res) => {
  try {
    const items = await LearningItem.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate("word");

    const wordIds = items
      .map((item) => item?.word?._id)
      .filter(Boolean);

    const statsDocs = wordIds.length
      ? await UserWordStat.find({
          user: req.user._id,
          word: { $in: wordIds },
        })
      : [];

    const statsMap = new Map(statsDocs.map((s) => [s.word.toString(), s]));

    const enrichedItems = items
      .filter((item) => item.word)
      .map((item) => {
        const wordObj = item.word?.toObject ? item.word.toObject() : item.word;
        const stat = statsMap.get(item.word._id.toString());

        wordObj.stats = stat
          ? {
              correctCount: stat.correctCount || 0,
              incorrectCount: stat.incorrectCount || 0,
              lastSeenAt: stat.lastSeenAt || null,
            }
          : {
              correctCount: 0,
              incorrectCount: 0,
              lastSeenAt: null,
            };

        return item.toObject ? { ...item.toObject(), word: wordObj } : { ...item, word: wordObj };
      });

    res.status(200).json({
      success: true,
      count: enrichedItems.length,
      data: enrichedItems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load learning words",
      error: error.message,
    });
  }
};

exports.addLearningItem = async (req, res) => {
  try {
    const { wordId } = req.body;

    if (!wordId) {
      return res.status(400).json({
        success: false,
        message: "Word id is required.",
      });
    }

    const word = await Word.findById(wordId);
    if (!word) {
      return res.status(404).json({
        success: false,
        message: "Word not found.",
      });
    }

    const item = await LearningItem.findOneAndUpdate(
      { user: req.user._id, word: wordId },
      { user: req.user._id, word: wordId },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).populate("word");

    res.status(201).json({
      success: true,
      message: "Word added to Currently Learning.",
      data: item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not add word to learning list",
      error: error.message,
    });
  }
};

exports.markLearningItemLearned = async (req, res) => {
  try {
    const deleted = await LearningItem.findOneAndDelete({
      user: req.user._id,
      word: req.params.wordId,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "This word is not in your learning list.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Marked as learned.",
      data: deleted,
    });
  } catch (error) {
    res.status(error.name === "CastError" ? 404 : 500).json({
      success: false,
      message: error.name === "CastError" ? "Learning word not found" : "Could not mark word as learned",
      error: error.message,
    });
  }
};
