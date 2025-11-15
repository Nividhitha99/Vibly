// ❗ INSERT YOUR OWN GENERATED KEY HERE (DO NOT SHARE IT ANYWHERE)
process.env.OPENAI_KEY = "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";

const express = require("express");
const cors = require("cors");
const app = express();

// Parse JSON
app.use(express.json());
app.use(cors());

// LowDB connection (initializes database)
require("./utils/db");

// Routes
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/taste", require("./routes/tasteRoutes"));
app.use("/api/match", require("./routes/matchRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));


// Health check
app.get("/health", (req, res) => {
  res.json({ status: "backend alive" });
});

// Start server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});
