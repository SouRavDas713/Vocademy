const express = require("express");
const router = express.Router();

const { login, me, signup } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", protect, me);

module.exports = router;
