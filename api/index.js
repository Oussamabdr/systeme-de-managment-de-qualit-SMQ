module.exports = async (req, res) => {
  // Set CORS headers immediately for ALL requests
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // CRITICAL: Handle OPTIONS requests FIRST, before anything else
  if (req.method === "OPTIONS") {
    console.log("OPTIONS request to", req.url);
    res.setHeader("Content-Length", "0");
    return res.writeHead(204, {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Credentials": "true"
    }).end();
  }

  try {
    // Quick health check
    if (req.url === "/api/health" || req.url === "/api") {
      return res.status(200).json({ success: true, message: "QMS API online", timestamp: new Date().toISOString() });
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
    console.error("Handler error:", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
  }
};
