module.exports = (req, res) => {
  // Test barebones GET endpoint
    // Extract path without /api prefix
    const path = req.url.replace(/^\/api/, "");

    // Test barebones GET endpoint
    if (path === "/test-get" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ success: true, message: "GET works" }));
  }

  // Test barebones OPTIONS endpoint
    if (path === "/test-options" && req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.writeHead(204);
    return res.end();
  }

  // Load and delegate everything else to Express app
  const serverless = require("serverless-http");
  const app = require("../backend/src/app");
  const handler = serverless(app);
  return handler(req, res);
};
