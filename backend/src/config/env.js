const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const env = {
  port: Number(process.env.PORT || 5000),
  corsOrigin: process.env.CORS_ORIGIN || "",
  jwtSecret: process.env.JWT_SECRET || "replace_me_in_production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  uploadDir: process.env.UPLOAD_DIR || "uploads",
};

module.exports = env;
