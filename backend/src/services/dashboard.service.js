const dashboardRepository = require("../repositories/dashboard.repository");
const { computeStatus } = require("./project-progress.service");

const DASHBOARD_CACHE_TTL_MS = 15000;
const dashboardCache = new Map();

function cacheKey(scope, period, userId) {
  return `${scope}:${userId || "-"}:${period || "all"}`;
}

function readCache(key) {
  const cached = dashboardCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.createdAt > DASHBOARD_CACHE_TTL_MS) {
    dashboardCache.delete(key);
    return null;
  }
  return cached.data;
}

function writeCache(key, data) {
  dashboardCache.set(key, { createdAt: Date.now(), data });
}

function getPeriodStart(period) {
  if (!period) return null;

  const now = new Date();
  const start = new Date(now);

  if (period === "week") {
    start.setDate(now.getDate() - 7);
    return start;
  }

  if (period === "month") {
    start.setMonth(now.getMonth() - 1);
    return start;
  }

  if (period === "quarter") {
    start.setMonth(now.getMonth() - 3);
    return start;
  }

  return null;
}

function buildStatusDistribution(tasks) {
  const statusCount = tasks.reduce(
    (acc, task) => {
      acc[task.status] += 1;
      return acc;
    },
    { TODO: 0, IN_PROGRESS: 0, DONE: 0 },
  );

  return [
    { name: "Todo", value: statusCount.TODO },
    { name: "In Progress", value: statusCount.IN_PROGRESS },
    { name: "Done", value: statusCount.DONE },
  ];
}

function buildProjectProgress(projects, groupedTaskCounts) {
  const countsByProjectId = new Map();

  for (const row of groupedTaskCounts) {
    const current = countsByProjectId.get(row.projectId) || { totalTasks: 0, doneTasks: 0 };
    const count = Number(row._count?._all || 0);
    current.totalTasks += count;
    if (row.status === "DONE") {
      current.doneTasks += count;
    }
    countsByProjectId.set(row.projectId, current);
  }

  return projects.map((project) => {
    const counts = countsByProjectId.get(project.id) || { totalTasks: 0, doneTasks: 0 };
    const progress = counts.totalTasks === 0
      ? 0
      : Math.round((counts.doneTasks / counts.totalTasks) * 100);
    const status = computeStatus({ progress, endDate: project.endDate });

    return {
      id: project.id,
      name: project.name,
      status,
      progress,
      totalTasks: counts.totalTasks,
      doneTasks: counts.doneTasks,
    };
  });
}

function buildResourceMonitoring(tasks) {
  const totals = tasks.reduce(
    (acc, task) => {
      const planned = Number(task.plannedHours || 0);
      const actual = Number(task.actualHours || 0);
      acc.totalPlannedHours += planned;
      acc.totalActualHours += actual;
      if (!planned) {
        acc.tasksWithoutPlan += 1;
      }
      return acc;
    },
    {
      totalPlannedHours: 0,
      totalActualHours: 0,
      tasksWithoutPlan: 0,
    },
  );

  const varianceHours = Number((totals.totalActualHours - totals.totalPlannedHours).toFixed(2));
  const variancePercent = totals.totalPlannedHours > 0
    ? Number(((varianceHours / totals.totalPlannedHours) * 100).toFixed(2))
    : 0;

  return {
    totalPlannedHours: Number(totals.totalPlannedHours.toFixed(2)),
    totalActualHours: Number(totals.totalActualHours.toFixed(2)),
    varianceHours,
    variancePercent,
    tasksWithoutPlan: totals.tasksWithoutPlan,
  };
}

function buildCriticalIssues({ delayedTasks, delayedProjects, resourceMonitoring }) {
  const issues = [];

  if (delayedProjects > 0) {
    issues.push({
      type: "DELAYED_PROJECTS",
      severity: delayedProjects > 2 ? "CRITICAL" : "HIGH",
      value: delayedProjects,
      recommendation: "Replanifier les jalons critiques et affecter des ressources sur les lots en retard.",
    });
  }

  if (delayedTasks > 0) {
    issues.push({
      type: "OVERDUE_TASKS",
      severity: delayedTasks > 5 ? "HIGH" : "MEDIUM",
      value: delayedTasks,
      recommendation: "Traiter d'abord les tâches échues avec impact client/processus et fixer une date ferme de reprise.",
    });
  }

  if (resourceMonitoring.variancePercent > 15) {
    issues.push({
      type: "RESOURCE_OVERRUN",
      severity: resourceMonitoring.variancePercent > 30 ? "CRITICAL" : "HIGH",
      value: resourceMonitoring.variancePercent,
      recommendation: "Réduire le périmètre non critique et réallouer les ressources vers les activités prioritaires.",
    });
  }

  return issues;
}

function buildCorrectiveActionSummary(actions) {
  const bySeverity = actions.reduce(
    (acc, action) => {
      acc[action.severity] = (acc[action.severity] || 0) + 1;
      return acc;
    },
    { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
  );

  return {
    openTotal: actions.length,
    bySeverity,
    topOpen: actions.slice(0, 5),
  };
}

function buildPilotageScore({ delayedTasks, delayedProjects, resourceMonitoring, criticalIssues, openCorrectiveActions, kpiRows }) {
  let score = 100;

  score -= Math.min(delayedProjects * 12, 36);
  score -= Math.min(delayedTasks * 2, 20);
  score -= Math.min(Math.max(0, resourceMonitoring.variancePercent) / 2, 15);

  const criticalCount = criticalIssues.filter((issue) => issue.severity === "CRITICAL").length;
  const highCount = criticalIssues.filter((issue) => issue.severity === "HIGH").length;
  score -= criticalCount * 10;
  score -= highCount * 5;

  const openCriticalActions = openCorrectiveActions.filter((action) => action.severity === "CRITICAL").length;
  const openHighActions = openCorrectiveActions.filter((action) => action.severity === "HIGH").length;
  score -= openCriticalActions * 6;
  score -= openHighActions * 3;

  const underperformingKpis = (kpiRows || []).filter((kpi) => kpi.achievement < 80).length;
  score -= Math.min(underperformingKpis * 2, 10);

  score = Math.max(0, Math.round(score));

  let level = "GOOD";
  if (score < 80) level = "WATCH";
  if (score < 60) level = "AT_RISK";
  if (score < 40) level = "CRITICAL";

  return { score, level, underperformingKpis };
}

function buildDecisionPlan({ criticalIssues, openCorrectiveActions }) {
  const issueActions = criticalIssues.map((issue) => ({
    source: issue.type,
    priority: issue.severity,
    action: issue.recommendation,
  }));

  const correctiveActions = openCorrectiveActions.slice(0, 5).map((item) => ({
    source: "OPEN_CAPA",
    priority: item.severity,
    action: item.recommendation || `Suivre l'action corrective: ${item.title}`,
    correctiveActionId: item.id,
    dueDate: item.dueDate || null,
  }));

  const merged = [...issueActions, ...correctiveActions];
  const severityRank = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

  return merged
    .sort((a, b) => (severityRank[b.priority] || 0) - (severityRank[a.priority] || 0))
    .slice(0, 8);
}

async function getOverview(period) {
  const key = cacheKey("overview", period);
  const cached = readCache(key);
  if (cached) return cached;

  const periodStart = getPeriodStart(period);
  const projectWhere = periodStart ? { updatedAt: { gte: periodStart } } : undefined;
  const taskWhere = periodStart ? { updatedAt: { gte: periodStart } } : undefined;
  const processWhere = periodStart ? { updatedAt: { gte: periodStart } } : undefined;

  const [projects, tasks, processes] = await Promise.all([
    dashboardRepository.findProjectsForOverview(projectWhere),
    dashboardRepository.findTasksForOverview(taskWhere),
    dashboardRepository.findProcessesForOverview(processWhere),
  ]);

  const projectIds = projects.map((project) => project.id);
  const groupedTaskCounts = await dashboardRepository.groupTasksByProjectAndStatus(projectIds);

  const now = new Date();
  const delayedTasks = tasks.filter(
    (task) => task.dueDate && task.status !== "DONE" && new Date(task.dueDate) < now,
  ).length;

  const projectProgress = buildProjectProgress(projects, groupedTaskCounts);

  const delayedProjects = projectProgress.filter((project) => project.status === "Delayed").length;
  const resourceMonitoring = buildResourceMonitoring(tasks);
  const openCorrectiveActions = await dashboardRepository.findOpenCorrectiveActions();
  const criticalIssues = buildCriticalIssues({ delayedTasks, delayedProjects, resourceMonitoring });

  // KPI achievement is computed from process indicators with { target, current }.
  const kpiRows = processes.flatMap((process) => {
    if (!Array.isArray(process.indicators)) return [];
    return process.indicators.map((indicator) => {
      const target = Number(indicator.target || 0);
      const current = Number(indicator.current || 0);
      const achievement = target > 0 ? Math.round((current / target) * 100) : 0;
      return {
        processName: process.name,
        indicatorName: indicator.name || "KPI",
        target,
        current,
        achievement,
      };
    });
  });

  const result = {
    summary: {
      totalProjects: projects.length,
      totalTasks: tasks.length,
      delayedTasks,
      delayedProjects,
    },
    resourceMonitoring,
    projectProgress,
    taskStatusDistribution: buildStatusDistribution(tasks),
    kpis: kpiRows,
    criticalIssues,
    correctiveActions: buildCorrectiveActionSummary(openCorrectiveActions),
    alerts: {
      overdueTasks: delayedTasks,
      delayedProjects,
    },
  };

  result.pilotage = {
    decisionHealth: buildPilotageScore({
      delayedTasks,
      delayedProjects,
      resourceMonitoring,
      criticalIssues,
      openCorrectiveActions,
      kpiRows,
    }),
    recommendedPlan: buildDecisionPlan({ criticalIssues, openCorrectiveActions }),
  };

  writeCache(key, result);
  return result;
}

async function getMyOverview(userId, period) {
  const key = cacheKey("my-overview", period, userId);
  const cached = readCache(key);
  if (cached) return cached;

  const periodStart = getPeriodStart(period);
  const where = { assigneeId: userId };
  if (periodStart) {
    where.updatedAt = { gte: periodStart };
  }

  const tasks = await dashboardRepository.findTasksForMyOverview(where);

  const now = new Date();
  const delayedTasks = tasks.filter(
    (task) => task.dueDate && task.status !== "DONE" && new Date(task.dueDate) < now,
  ).length;

  const assignedProjectIds = [...new Set(tasks.map((task) => task.projectId).filter(Boolean))];
  const projectWhere = { id: { in: assignedProjectIds } };
  if (periodStart) {
    projectWhere.updatedAt = { gte: periodStart };
  }

  const scopedProjects = assignedProjectIds.length
    ? await dashboardRepository.findScopedProjects(projectWhere)
    : [];

  const groupedTaskCounts = await dashboardRepository.groupTasksByProjectAndStatus(assignedProjectIds);

  const projectProgress = buildProjectProgress(scopedProjects, groupedTaskCounts);

  const delayedProjects = projectProgress.filter((project) => project.status === "Delayed").length;
  const resourceMonitoring = buildResourceMonitoring(tasks);
  const openCorrectiveActions = await dashboardRepository.findOpenCorrectiveActions({ ownerId: userId });
  const criticalIssues = buildCriticalIssues({ delayedTasks, delayedProjects, resourceMonitoring });

  const result = {
    summary: {
      totalProjects: projectProgress.length,
      totalTasks: tasks.length,
      delayedTasks,
      delayedProjects,
    },
    resourceMonitoring,
    projectProgress,
    taskStatusDistribution: buildStatusDistribution(tasks),
    kpis: [],
    criticalIssues,
    correctiveActions: buildCorrectiveActionSummary(openCorrectiveActions),
    alerts: {
      overdueTasks: delayedTasks,
      delayedProjects,
    },
  };

  result.pilotage = {
    decisionHealth: buildPilotageScore({
      delayedTasks,
      delayedProjects,
      resourceMonitoring,
      criticalIssues,
      openCorrectiveActions,
      kpiRows: [],
    }),
    recommendedPlan: buildDecisionPlan({ criticalIssues, openCorrectiveActions }),
  };

  writeCache(key, result);
  return result;
}

module.exports = { getOverview, getMyOverview };
