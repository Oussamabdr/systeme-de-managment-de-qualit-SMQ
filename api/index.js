const serverless = require("serverless-http");

let app;
try {
  app = require("../backend/src/app");
} catch (error) {
  console.error("Failed to load app:", error);
  // Fallback app if main app fails to load
  const express = require("express");
  app = express();
  app.use(express.json());
  app.all("*", (req, res) => {
    res.status(503).json({ success: false, message: "API initializing, please retry", error: error?.message });
  });
}

module.exports = serverless(app);
