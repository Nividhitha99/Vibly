// ❗ INSERT YOUR OWN GENERATED KEY HERE (DO NOT SHARE IT ANYWHERE)
process.env.OPENAI_KEY = "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";

const express = require("express");
const cors = require("cors");
const app = express();

// Middleware - must be before routes
app.use(express.json());
app.use(cors());

// Request logger - see all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// LowDB connection (initializes database)
require("./utils/db");

// API Routes - must be before catch-all handlers
try {
  const userRoutes = require("./routes/userRoutes");
  app.use("/api/user", userRoutes);
  console.log("✓ User routes loaded");
  
  // Test route to verify routing works
  app.post("/api/user/test", (req, res) => {
    res.json({ message: "Test route works!" });
  });
} catch (err) {
  console.error("✗ Error loading user routes:", err.message);
  console.error(err.stack);
}

app.use("/api/taste", require("./routes/tasteRoutes"));
app.use("/api/match", require("./routes/matchRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));
app.use("/api/ai", require("./routes/conversationRoutes"));
app.use("/api/recommend", require("./routes/aiRecommendationRoutes"));
app.use("/api/watchlist", require("./routes/watchListRoutes"));
app.use("/api/match-status", require("./routes/matchStatusRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/ai-chat", require("./routes/chatAIroutes"));





// Health check
app.get("/health", (req, res) => {
  res.json({ status: "backend alive" });
});

// 404 handler - must be last, after all routes
app.use((req, res) => {
  console.log(`[404] ${req.method} ${req.url} - Not found`);
  res.status(404).json({ error: "Not found" });
});

// Start server
//app.listen(5000, () => {
 
//});
module.exports = app;
