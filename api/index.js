const app = require("../backend/src/app");

module.exports = (req, res) => {
  // Keep this fast-path to avoid preflight failures before middleware chain runs.
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
    );
    res.setHeader("Access-Control-Allow-Credentials", "true");
    return res.status(204).end();
  }

  return app(req, res);
};
