const express = require("express");
const dashboardController = require("../controllers/dashboard.controller");
const { authorize } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/overview", authorize("ADMIN", "PROJECT_MANAGER", "CAQ"), dashboardController.getOverview);
router.get("/my-overview", dashboardController.getMyOverview);
router.post("/report", authorize("ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "CAQ"), dashboardController.createReport);

module.exports = router;
