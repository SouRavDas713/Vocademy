const User = require("../models/User");
const { verify } = require("../utils/token");

exports.protect = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const payload = verify(token);

  if (!payload) {
    return res.status(401).json({
      success: false,
      message: "Please sign in first.",
    });
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Your account could not be found.",
    });
  }

  req.user = user;
  next();
};

exports.adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only admins can add words.",
    });
  }

  next();
};
