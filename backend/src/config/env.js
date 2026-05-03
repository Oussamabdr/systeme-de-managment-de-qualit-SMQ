const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

const repoRootEnvPath = path.resolve(process.cwd(), ".env");
const backendEnvPath = path.resolve(__dirname, "../../.env");
const envPath = fs.existsSync(backendEnvPath) ? backendEnvPath : repoRootEnvPath;

dotenv.config({ path: envPath });

const env = {
  port: Number(process.env.PORT || 5000),
  corsOrigin: process.env.CORS_ORIGIN || "",
  jwtSecret: process.env.JWT_SECRET || "replace_me_in_production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  uploadDir: process.env.UPLOAD_DIR || "uploads",
};

module.exports = env;
