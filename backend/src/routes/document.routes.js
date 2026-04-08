const express = require("express");
const documentController = require("../controllers/document.controller");
const upload = require("../middlewares/upload.middleware");
const { authorize } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/", documentController.listDocuments);
router.post(
  "/upload",
  authorize("ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"),
  upload.single("file"),
  documentController.uploadDocument,
);

module.exports = router;
