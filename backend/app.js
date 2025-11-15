process.env.OPENAI_KEY = "your-key";

const express = require("express");
const cors = require("cors");
const app = express();

app.use(express.json());

// GLOBAL CORS CONFIG
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// SAFEST EXPRESS 5 PREFLIGHT HANDLER
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
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
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/ai-chat", require("./routes/chatAIroutes"));

// HEALTH CHECK
app.get("/health", (req, res) => {
  res.json({ status: "backend alive" });
});

// NOT FOUND
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

module.exports = app;
