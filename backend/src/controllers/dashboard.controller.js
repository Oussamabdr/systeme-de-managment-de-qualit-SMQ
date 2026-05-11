const dashboardService = require("../services/dashboard.service");

function isMissingTableError(error) {
  return (
    error?.code === "P2021" ||
    /does not exist in the current database/i.test(error?.message || "")
  );
}

function buildEmptyOverview() {
  return {
    summary: {
      totalProjects: 0,
      totalTasks: 0,
      delayedTasks: 0,
      delayedProjects: 0,
    },
    resourceMonitoring: {
      totalPlannedHours: 0,
      totalActualHours: 0,
      varianceHours: 0,
      variancePercent: 0,
      tasksWithoutPlan: 0,
    },
    projectProgress: [],
    taskStatusDistribution: [
      { name: "Todo", value: 0 },
      { name: "In Progress", value: 0 },
      { name: "Done", value: 0 },
    ],
    kpis: [],
    requirementAssessments: {
      averageScore: 0,
      veracityDistribution: [
        { value: "FALSE", label: "Faux", count: 0 },
        { value: "RATHER_FALSE", label: "Plutôt faux", count: 0 },
        { value: "RATHER_TRUE", label: "Plutôt vrai", count: 0 },
        { value: "TRUE", label: "Vrai", count: 0 },
      ],
      rows: [],
    },
    criticalIssues: [],
    correctiveActions: {
      openTotal: 0,
      bySeverity: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
      topOpen: [],
    },
    alerts: {
      overdueTasks: 0,
      delayedProjects: 0,
    },
    pilotage: {
      decisionHealth: { score: 100, level: "GOOD", underperformingKpis: 0 },
      recommendedPlan: [],
    },
  };
}

async function getOverview(req, res, next) {
  try {
    const data = await dashboardService.getOverview(req.query.period);
    res.json({ success: true, data });
  } catch (error) {
    if (isMissingTableError(error)) {
      return res.json({ success: true, data: buildEmptyOverview() });
    }
    next(error);
  }
}

async function getMyOverview(req, res, next) {
  try {
    const data = await dashboardService.getMyOverview(req.user.id, req.query.period);
    res.json({ success: true, data });
  } catch (error) {
    if (isMissingTableError(error)) {
      return res.json({ success: true, data: buildEmptyOverview() });
    }
    next(error);
  }
}

module.exports = { getOverview, getMyOverview };
