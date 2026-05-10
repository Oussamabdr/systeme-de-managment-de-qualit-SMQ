module.exports = async (req, res) => {
  try {
    // Set CORS headers immediately for all requests
    const origin = req.headers.origin || "*";
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Max-Age", "86400");

    // Handle all preflight OPTIONS requests immediately
    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

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
