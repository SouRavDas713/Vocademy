const express = require("express");
const router = express.Router();

const {
  getTopPics,
  addTopPic,
  removeTopPic,
} = require("../controllers/topPicsController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.route("/").get(getTopPics).post(addTopPic);
router.route("/:wordId").delete(removeTopPic);

module.exports = router;
