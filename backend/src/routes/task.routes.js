const express = require("express");
const taskController = require("../controllers/task.controller");
const { checkRole, enforceTaskOwnership } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/", taskController.listTasks);
router.get("/kanban", taskController.kanban);
router.get("/:id", taskController.getTask);
router.post("/", checkRole("PROJECT_MANAGER"), taskController.createTask);
router.patch("/:id", checkRole("PROJECT_MANAGER", "TEAM_MEMBER"), enforceTaskOwnership, taskController.updateTask);
router.delete("/:id", checkRole("PROJECT_MANAGER"), taskController.deleteTask);

module.exports = router;
