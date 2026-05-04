const criteriaService = require("../services/criteria.service");

async function listCriteria(_req, res, next) {
  try {
    const data = await criteriaService.listCriteria();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = { listCriteria };
