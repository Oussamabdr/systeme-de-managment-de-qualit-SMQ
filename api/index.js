module.exports = async (req, res) => {
  try {
    // Immediate OPTIONS response
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
      res.setHeader("Access-Control-Allow-Credentials", "true");
      return res.status(204).end();
    }

    // Quick health check
    if (req.url === "/api/health" || req.url === "/api") {
      return res.status(200).json({ success: true, message: "QMS API online", timestamp: new Date().toISOString() });
    }

    // Load and delegate to Express app
    const serverless = require("serverless-http");
    const app = require("../backend/src/app");
    const handler = serverless(app);
    return handler(req, res);
  } catch (error) {
    console.error("Handler error:", error);
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};
