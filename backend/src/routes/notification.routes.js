const express = require("express");
const notificationController = require("../controllers/notification.controller");

const router = express.Router();

router.get("/", notificationController.listNotifications);
router.get("/unread-count", notificationController.getUnreadCount);

module.exports = router;
