const express = require("express");
const dashboardController = require("../controllers/dashboard.controller");
const { authorize } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/overview", authorize("ADMIN", "PROJECT_MANAGER"), dashboardController.getOverview);
router.get("/my-overview", dashboardController.getMyOverview);

module.exports = router;
