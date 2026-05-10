module.exports = (req, res) => {
  // Test barebones endpoint
  if (req.url === "/api/test-options" && req.method === "OPTIONS") {
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
