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
app.listen(5000, () => {
 
});
