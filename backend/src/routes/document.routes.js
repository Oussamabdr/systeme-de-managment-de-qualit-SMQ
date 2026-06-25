const express = require("express");
const documentController = require("../controllers/document.controller");
const upload = require("../middlewares/upload.middleware");
const { authenticate, authorize } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/", authenticate, authorize("ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "CAQ"), documentController.listDocuments);
router.get("/:id/download", authenticate, authorize("ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "CAQ"), documentController.downloadDocument);
router.post(
  "/upload",
  authenticate,
  authorize("ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"),
  upload.single("file"),
  documentController.uploadDocument,
);

module.exports = router;
