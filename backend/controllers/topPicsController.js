const TopPic = require("../models/TopPic");
const Word = require("../models/Word");
const UserWordStat = require("../models/UserWordStat");

exports.getTopPics = async (req, res) => {
  try {
    const items = await TopPic.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate("word");

    const wordIds = items.map((it) => it?.word?._id).filter(Boolean);

    const statsDocs = wordIds.length
      ? await UserWordStat.find({ user: req.user._id, word: { $in: wordIds } })
      : [];

    const statsMap = new Map(statsDocs.map((s) => [s.word.toString(), s]));

    const enriched = items
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
          : { correctCount: 0, incorrectCount: 0, lastSeenAt: null };

        return item.toObject
          ? { ...item.toObject(), word: wordObj }
          : { ...item, word: wordObj };
      });

    res
      .status(200)
      .json({ success: true, count: enriched.length, data: enriched });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to load Top Pics",
        error: error.message,
      });
  }
};

exports.addTopPic = async (req, res) => {
  try {
    const { wordId } = req.body;
    if (!wordId)
      return res
        .status(400)
        .json({ success: false, message: "Word id is required." });

    const word = await Word.findById(wordId);
    if (!word)
      return res
        .status(404)
        .json({ success: false, message: "Word not found." });

    const item = await TopPic.findOneAndUpdate(
      { user: req.user._id, word: wordId },
      { user: req.user._id, word: wordId },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).populate("word");

    res
      .status(201)
      .json({
        success: true,
        message: "Word added to Your Top Pics.",
        data: item,
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Could not add word to Top Pics",
        error: error.message,
      });
  }
};

exports.removeTopPic = async (req, res) => {
  try {
    const removed = await TopPic.findOneAndDelete({
      user: req.user._id,
      word: req.params.wordId,
    });
    if (!removed)
      return res
        .status(404)
        .json({ success: false, message: "Top Pic not found." });

    res
      .status(200)
      .json({
        success: true,
        message: "Removed from Top Pics.",
        data: removed,
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Could not remove Top Pic",
        error: error.message,
      });
  }
};
