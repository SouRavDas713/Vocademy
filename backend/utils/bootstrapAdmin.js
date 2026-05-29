const User = require("../models/User");

const bootstrapAdmin = async () => {
  const email = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || "");

  if (!email || !password) {
    return;
  }

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== "admin") {
      existing.role = "admin";
      await existing.save();
      console.log(`Admin role granted to ${email}`);
    }
    return;
  }

  await User.create({
    email,
    passwordHash: User.hashPassword(password),
    role: "admin",
  });
  console.log(`Admin user created for ${email}`);
};

module.exports = bootstrapAdmin;
