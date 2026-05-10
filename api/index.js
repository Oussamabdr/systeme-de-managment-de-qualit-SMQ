module.exports = (req, res) => {
  // Quick OPTIONS response before loading Express app
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.status(204).end();
  }

  const serverless = require("serverless-http");
  const app = require("../backend/src/app");
  const handler = serverless(app);
  return handler(req, res);
};
