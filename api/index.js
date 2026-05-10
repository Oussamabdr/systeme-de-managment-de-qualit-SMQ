module.exports = (req, res) => {
  // Load and delegate everything to Express app
  const serverless = require("serverless-http");
  const app = require("../backend/src/app");
  const handler = serverless(app);
  return handler(req, res);
};
