const fs = require("fs");
const path = require("path");
const os = require("os");
const multer = require("multer");
const env = require("../config/env");

let uploadPath = path.resolve(process.cwd(), env.uploadDir);
try {
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
} catch (error) {
  // Fallback to temp dir for read-only environments (e.g., serverless)
  uploadPath = path.join(os.tmpdir(), "uploads");
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "-").toLowerCase();
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = upload;
