const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const parsed = dotenv.parse(fs.readFileSync(filePath));
  for (const [key, value] of Object.entries(parsed)) {
    if (process.env[key] === undefined && value !== "") {
      process.env[key] = value;
    }
  }
}

function loadEnv() {
  const backendRoot = path.resolve(__dirname, "../..");
  const repoRoot = path.resolve(backendRoot, "..");

  [
    path.join(backendRoot, ".env.local"),
    path.join(backendRoot, ".env"),
    path.join(repoRoot, ".env.local"),
    path.join(repoRoot, ".env"),
  ].forEach(loadEnvFile);
}

module.exports = { loadEnv };
