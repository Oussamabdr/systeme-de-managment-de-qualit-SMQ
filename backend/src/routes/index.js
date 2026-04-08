const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");

const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const processRoutes = require("./process.routes");
const projectRoutes = require("./project.routes");
const taskRoutes = require("./task.routes");
const dashboardRoutes = require("./dashboard.routes");
const documentRoutes = require("./document.routes");
const notificationRoutes = require("./notification.routes");

const router = express.Router();

router.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "QMS API online",
    docs: {
      health: "/api/health",
      login: "POST /api/auth/login",
    },
  });
});

router.get("/health", (_req, res) => {
  res.json({ success: true, message: "QMS API healthy" });
});

router.use("/auth", authRoutes);
router.use(authenticate);
router.use("/users", userRoutes);
router.use("/processes", processRoutes);
router.use("/projects", projectRoutes);
router.use("/tasks", taskRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/documents", documentRoutes);
router.use("/notifications", notificationRoutes);

module.exports = router;
