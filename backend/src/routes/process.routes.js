const express = require("express");
const processController = require("../controllers/process.controller");
const { authorize } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/", processController.listProcesses);
router.get("/:id", processController.getProcess);
router.get("/:id/progress", processController.getProcessProgress);
router.get("/:id/assessment", processController.getProcessAssessment);
router.put("/:id/assessment", authorize("ADMIN", "PROJECT_MANAGER"), processController.saveProcessAssessment);
router.post("/", authorize("ADMIN", "PROJECT_MANAGER"), processController.createProcess);
router.patch("/:id", authorize("ADMIN", "PROJECT_MANAGER"), processController.updateProcess);
router.delete("/:id", authorize("ADMIN"), processController.deleteProcess);

module.exports = router;
