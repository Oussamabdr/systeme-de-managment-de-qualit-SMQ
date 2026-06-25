const notificationService = require("../services/notification.service");

async function listNotifications(req, res, next) {
  try {
    const data = await notificationService.getNotifications(req.user);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getUnreadCount(req, res, next) {
  try {
    const data = await notificationService.getUnreadCount(req.user);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = { listNotifications, getUnreadCount };
