// Load environment variables from .env file (optional)
require("dotenv").config();

// Hardcoded API keys (for development)
process.env.GEMINI_KEY = process.env.GEMINI_KEY || "AIzaSyDwAi9MThmlibUi7pjXr2qEi3Kp-shFcMI";
process.env.TMDB_API_KEY = process.env.TMDB_API_KEY || "e3f340ed60a45e0fd320fb3e4b624b3c";
process.env.SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || "ecd944e392f245a7a893dceacfca6834";
process.env.SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || "1e2c66214bae4630a2513415864bd993";

console.log("✓ API keys configured (using hardcoded values or .env if present)");

const express = require("express");
const cors = require("cors");
const app = express();

app.use(express.json());

// GLOBAL CORS CONFIG - Allow multiple localhost ports for development
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all origins in development (change in production)
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-user-id"],
  })
);

// SAFEST EXPRESS 5 PREFLIGHT HANDLER
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin) || !origin) {
      res.header("Access-Control-Allow-Origin", origin || "*");
    }
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-user-id");
    res.header("Access-Control-Allow-Credentials", "true");
    return res.sendStatus(200);
  }
  next();
});

// LOGGER
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

require("./utils/db");

// ROUTES
const userRoutes = require("./routes/userRoutes");
app.use("/api/user", userRoutes);
console.log("✓ User routes loaded");

app.use("/api/taste", require("./routes/tasteRoutes"));
app.use("/api/match", require("./routes/matchRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));
app.use("/api/ai", require("./routes/conversationRoutes"));
app.use("/api/recommend", require("./routes/aiRecommendationRoutes"));
app.use("/api/watchlist", require("./routes/watchListRoutes"));
app.use("/api/match-status", require("./routes/matchStatusRoutes"));
app.use("/api/pass", require("./routes/passRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/ai-chat", require("./routes/chatAIroutes"));
app.use("/api/search", require("./routes/searchRoutes"));
app.use("/api/follow", require("./routes/followRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

// HEALTH CHECK
app.get("/health", (req, res) => {
  res.json({ status: "backend alive" });
});

// NOT FOUND
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

module.exports = app;
