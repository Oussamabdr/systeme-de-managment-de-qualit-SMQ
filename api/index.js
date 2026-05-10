module.exports = async (req, res) => {
  try {
    // Set CORS headers immediately for all requests
    const origin = req.headers.origin || "*";
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    // Immediate OPTIONS response
    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    // Quick health check
    if (req.url === "/api/health" || req.url === "/api") {
      return res.status(200).json({ success: true, message: "QMS API online", timestamp: new Date().toISOString() });
    }

    // Test endpoint (bypass Express)
    if (req.url === "/api/auth/login-test" && req.method === "POST") {
      return res.status(200).json({ success: true, message: "Login test OK", body: req.body });
    }

    // Load Express app with timeout protection
    const serverless = require("serverless-http");
    const app = require("../backend/src/app");
    const handler = serverless(app);
    
    // Wrap with timeout
    return Promise.race([
      handler(req, res),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), 25000)
      )
    ]).catch(err => {
      if (!res.headersSent) {
        res.status(503).json({ success: false, message: "Request timeout or error", error: err.message });
      }
    });
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
  }
};
