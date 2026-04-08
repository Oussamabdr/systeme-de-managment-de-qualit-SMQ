const prisma = require("../config/prisma");
const { computeProgressSnapshot } = require("./project-progress.service");

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

async function getOverview(period) {
  const periodStart = getPeriodStart(period);
  const projectWhere = periodStart ? { updatedAt: { gte: periodStart } } : undefined;
  const taskWhere = periodStart ? { updatedAt: { gte: periodStart } } : undefined;
  const processWhere = periodStart ? { updatedAt: { gte: periodStart } } : undefined;

  const [projects, tasks, processes] = await Promise.all([
    prisma.project.findMany({ where: projectWhere, include: { tasks: true } }),
    prisma.task.findMany({ where: taskWhere }),
    prisma.process.findMany({ where: processWhere }),
  ]);

  const now = new Date();
  const delayedTasks = tasks.filter(
    (task) => task.dueDate && task.status !== "DONE" && new Date(task.dueDate) < now,
  ).length;

  const projectProgress = projects.map((project) => {
    const snapshot = computeProgressSnapshot(project);
    return {
      id: project.id,
      name: project.name,
      status: snapshot.status,
      progress: snapshot.progress,
      totalTasks: snapshot.totalTasks,
      doneTasks: snapshot.completedTasks,
    };
  });

  const delayedProjects = projectProgress.filter((project) => project.status === "Delayed").length;

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

  return {
    summary: {
      totalProjects: projects.length,
      totalTasks: tasks.length,
      delayedTasks,
      delayedProjects,
    },
    projectProgress,
    taskStatusDistribution: buildStatusDistribution(tasks),
    kpis: kpiRows,
    alerts: {
      overdueTasks: delayedTasks,
      delayedProjects,
    },
  };
}

async function getMyOverview(userId, period) {
  const periodStart = getPeriodStart(period);
  const where = { assigneeId: userId };
  if (periodStart) {
    where.updatedAt = { gte: periodStart };
  }

  const tasks = await prisma.task.findMany({
    where,
    include: {
      project: {
        select: { id: true, name: true, status: true },
      },
    },
  });

  const now = new Date();
  const delayedTasks = tasks.filter(
    (task) => task.dueDate && task.status !== "DONE" && new Date(task.dueDate) < now,
  ).length;

  const assignedProjectIds = [...new Set(tasks.map((task) => task.project?.id).filter(Boolean))];
  const projectWhere = { id: { in: assignedProjectIds } };
  if (periodStart) {
    projectWhere.updatedAt = { gte: periodStart };
  }

  const scopedProjects = assignedProjectIds.length
    ? await prisma.project.findMany({ where: projectWhere, include: { tasks: true } })
    : [];

  const projectProgress = scopedProjects.map((project) => {
    const snapshot = computeProgressSnapshot(project);
    return {
      id: project.id,
      name: project.name,
      status: snapshot.status,
      totalTasks: snapshot.totalTasks,
      doneTasks: snapshot.completedTasks,
      progress: snapshot.progress,
    };
  });

  const delayedProjects = projectProgress.filter((project) => project.status === "Delayed").length;

  return {
    summary: {
      totalProjects: projectProgress.length,
      totalTasks: tasks.length,
      delayedTasks,
      delayedProjects,
    },
    projectProgress,
    taskStatusDistribution: buildStatusDistribution(tasks),
    kpis: [],
    alerts: {
      overdueTasks: delayedTasks,
      delayedProjects,
    },
  };
}

module.exports = { getOverview, getMyOverview };
