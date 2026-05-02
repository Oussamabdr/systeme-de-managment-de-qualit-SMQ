module.exports = async (req, res) => {
  try {
    // For health check or simple test, return status without loading full app
    if (req.url === "/api/health" || req.url === "/api") {
      return res.status(200).json({ success: true, message: "QMS API online", timestamp: new Date().toISOString() });
    }

    // For other endpoints, load and use the full app
    const serverless = require("serverless-http");
    let app;
    try {
      app = require("../backend/src/app");
    } catch (error) {
      console.error("Failed to load app:", error.message);
      return res.status(503).json({ success: false, message: "API unavailable", error: error.message });
    }

    const handler = serverless(app);
    return handler(req, res);
  } catch (error) {
    console.error("Handler error:", error);
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};
