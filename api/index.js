module.exports = (req, res) => {
  const serverless = require("serverless-http");
  const app = require("../backend/src/app");
  const handler = serverless(app);
  return handler(req, res);
};
