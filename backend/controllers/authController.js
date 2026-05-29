const User = require("../models/User");
const { createAuthToken } = require("../utils/token");

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const sendAuthResponse = (res, user, status = 200) => {
  res.status(status).json({
    success: true,
    token: createAuthToken(user),
    user: user.toAuthJSON(),
  });
};

exports.signup = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const user = await User.create({
      email,
      passwordHash: User.hashPassword(password),
      role: "user",
    });

    sendAuthResponse(res, user, 201);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Signup failed.",
      error: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");
    const selectedRole = req.body.role === "admin" ? "admin" : "user";

    const user = await User.findOne({ email });
    if (!user || !user.comparePassword(password)) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (user.role !== selectedRole) {
      return res.status(403).json({
        success: false,
        message: `This account is not registered as ${selectedRole}.`,
      });
    }

    sendAuthResponse(res, user);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Sign in failed.",
      error: error.message,
    });
  }
};

exports.me = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user.toAuthJSON(),
  });
};
