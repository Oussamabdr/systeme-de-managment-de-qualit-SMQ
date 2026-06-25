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

  const receivedReports = await prisma.correctiveAction.findMany({
    where: user?.id
      ? {
          ownerId: user.id,
          status: { in: ["OPEN", "IN_PROGRESS"] },
        }
      : undefined,
    include: {
      createdBy: {
        select: { id: true, fullName: true, email: true, role: true },
      },
      owner: {
        select: { id: true, fullName: true, email: true, role: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

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
      receivedReports,
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
    receivedReports,
  };
}

async function getUnreadCount(user) {
  const now = new Date();

  const receivedReportsCount = user?.id
    ? await prisma.correctiveAction.count({
        where: {
          ownerId: user.id,
          status: { in: ["OPEN", "IN_PROGRESS"] },
        },
      })
    : 0;

  const overdueTaskWhere = user?.role === "TEAM_MEMBER"
    ? { assigneeId: user.id, dueDate: { lt: now }, status: { not: "DONE" } }
    : { dueDate: { lt: now }, status: { not: "DONE" } };

  const overdueTasksCount = await prisma.task.count({ where: overdueTaskWhere });

  const delayedProjects = user?.role === "TEAM_MEMBER"
    ? await findComputedDelayedProjects(
        (
          await prisma.task.findMany({
            where: { assigneeId: user.id },
            select: { projectId: true },
            distinct: ["projectId"],
          })
        ).map((r) => r.projectId).filter(Boolean)
      )
    : await findComputedDelayedProjects(
        (await prisma.project.findMany({ select: { id: true } })).map((p) => p.id)
      );

  return {
    count: receivedReportsCount + overdueTasksCount + delayedProjects.length,
    breakdown: {
      reports: receivedReportsCount,
      overdueTasks: overdueTasksCount,
      delayedProjects: delayedProjects.length,
    },
  };
}

module.exports = { getNotifications, getUnreadCount };
