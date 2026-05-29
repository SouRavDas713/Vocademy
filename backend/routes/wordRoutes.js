const express = require("express");
const router = express.Router();

const { getAllWords, getWordById, getTestQuestion, createWord, updateWord, recordTestAnswer } = require("../controllers/wordController");
const { protect } = require("../middleware/authMiddleware");

router.route("/").get(getAllWords).post(protect, createWord);
router.route("/test-question").get(getTestQuestion);
router.route("/test-answer").post(protect, recordTestAnswer);
router.route("/:id").get(getWordById).put(protect, updateWord);

module.exports = router;
