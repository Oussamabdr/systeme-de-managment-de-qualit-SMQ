const prisma = require("../config/prisma");
const { computeStatus } = require("./project-progress.service");

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

    return {
      id: project.id,
      name: project.name,
      progress,
      status: computeStatus({ progress, endDate: project.endDate }),
    };
  });
}

async function findComputedDelayedProjects(projectIds) {
  if (!projectIds || projectIds.length === 0) return [];

  const projects = await prisma.project.findMany({
    where: { id: { in: projectIds } },
    select: { id: true, name: true, endDate: true },
  });

  if (projects.length === 0) return [];

  const groupedTaskCounts = await prisma.task.groupBy({
    by: ["projectId", "status"],
    where: { projectId: { in: projects.map((p) => p.id) } },
    _count: { _all: true },
  });

  return buildProjectProgress(projects, groupedTaskCounts)
    .filter((project) => project.status === "Delayed")
    .map(({ id, name, status }) => ({ id, name, status }));
}

async function getNotifications(user) {
  const now = new Date();

  if (user?.role === "TEAM_MEMBER") {
    const overdueTasks = await prisma.task.findMany({
      where: {
        assigneeId: user.id,
        dueDate: { lt: now },
        status: { not: "DONE" },
      },
      include: {
        assignee: {
          select: { id: true, fullName: true },
        },
        project: {
          select: { id: true, name: true, status: true },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    const assignedTasks = await prisma.task.findMany({
      where: { assigneeId: user.id },
      select: { projectId: true },
    });

    const projectIds = [...new Set(assignedTasks.map((row) => row.projectId).filter(Boolean))];
    const delayedProjects = await findComputedDelayedProjects(projectIds);

    return {
      overdueTasks,
      delayedProjects,
    };
  }

  const overdueTasks = await prisma.task.findMany({
    where: {
      dueDate: { lt: now },
      status: { not: "DONE" },
    },
    include: {
      assignee: {
        select: { id: true, fullName: true },
      },
      project: {
        select: { id: true, name: true },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  const projectRows = await prisma.project.findMany({
    select: { id: true },
  });

  const delayedProjects = await findComputedDelayedProjects(projectRows.map((p) => p.id));

  return {
    overdueTasks,
    delayedProjects,
  };
}

module.exports = { getNotifications };
