const express = require("express");
const projectController = require("../controllers/project.controller");
const { authorize } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/", projectController.listProjects);
router.get("/:id", projectController.getProject);
router.get("/:id/progress", projectController.getProjectProgress);
router.post("/", authorize("ADMIN", "PROJECT_MANAGER"), projectController.createProject);
router.patch("/:id", authorize("ADMIN", "PROJECT_MANAGER"), projectController.updateProject);
router.delete("/:id", authorize("ADMIN"), projectController.deleteProject);
router.post("/:id/processes", authorize("ADMIN", "PROJECT_MANAGER"), projectController.assignProcesses);

module.exports = router;
