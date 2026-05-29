const express = require("express");
const router = express.Router();

const {
  addLearningItem,
  getLearningItems,
  markLearningItemLearned,
} = require("../controllers/learningController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.route("/").get(getLearningItems).post(addLearningItem);
router.route("/:wordId/learned").delete(markLearningItemLearned);

module.exports = router;
