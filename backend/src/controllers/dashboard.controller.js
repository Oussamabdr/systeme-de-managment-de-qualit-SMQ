const dashboardService = require("../services/dashboard.service");

async function getOverview(req, res, next) {
  try {
    const data = await dashboardService.getOverview(req.query.period);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getMyOverview(req, res, next) {
  try {
    const data = await dashboardService.getMyOverview(req.user.id, req.query.period);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = { getOverview, getMyOverview };
