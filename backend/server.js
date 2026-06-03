const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const bootstrapAdmin = require("./utils/bootstrapAdmin");
const authRoutes = require("./routes/authRoutes");
const learningRoutes = require("./routes/learningRoutes");
const topPicsRoutes = require("./routes/topPicsRoutes");
const wordRoutes = require("./routes/wordRoutes");

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Connect to MongoDB Database
connectDB().then(bootstrapAdmin);

// Middlewares
const allowedOrigins = [
  "https://vocademy.onrender.com",
  "https://vocademy7.netlify.app",
];
app.use(
  cors({
    origin: process.env.NODE_ENV === "production" ? allowedOrigins : "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Welcome Route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to the Vocademy API Gateway!",
    status: "Operational",
  });
});

// Mounting Routing Modules
app.use("/api/auth", authRoutes);
app.use("/api/learning", learningRoutes);
app.use("/api/top-pics", topPicsRoutes);
app.use("/api/words", wordRoutes);

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.originalUrl}`,
  });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error(`App Error: ${err.message}`);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.stack : {},
  });
});

// Configure listening port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `[Vocademy Server] Running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`,
  );
});
