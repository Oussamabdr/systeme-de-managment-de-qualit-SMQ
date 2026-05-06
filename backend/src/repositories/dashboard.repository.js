const prisma = require("../config/prisma");

async function findProjectsForOverview(where) {
  return prisma.project.findMany({
    where,
    select: {
      id: true,
      name: true,
      endDate: true,
    },
  });
}

async function findTasksForOverview(where) {
  return prisma.task.findMany({
    where,
    select: {
      status: true,
      dueDate: true,
      plannedHours: true,
      actualHours: true,
    },
  });
}

async function findProcessesForOverview(where) {
  return prisma.process.findMany({
    where,
    select: {
      id: true,
      name: true,
      indicators: true,
      processCriterions: {
        where: {
          selected: true,
        },
        select: {
          score: true,
          veracityLevel: true,
          updatedAt: true,
          criterion: {
            select: {
              code: true,
            },
          },
        },
      },
    },
  });
}

async function groupTasksByProjectAndStatus(projectIds) {
  if (!projectIds || projectIds.length === 0) {
    return [];
  }

  return prisma.task.groupBy({
    by: ["projectId", "status"],
    where: { projectId: { in: projectIds } },
    _count: { _all: true },
  });
}

async function findTasksForMyOverview(where) {
  return prisma.task.findMany({
    where,
    select: {
      status: true,
      dueDate: true,
      projectId: true,
      plannedHours: true,
      actualHours: true,
    },
  });
}

async function findScopedProjects(where) {
  return prisma.project.findMany({
    where,
    select: {
      id: true,
      name: true,
      endDate: true,
    },
  });
}

async function findOpenCorrectiveActions(where) {
  return prisma.correctiveAction.findMany({
    where: {
      ...(where || {}),
      status: { in: ["OPEN", "IN_PROGRESS"] },
    },
    select: {
      id: true,
      title: true,
      severity: true,
      status: true,
      dueDate: true,
      recommendation: true,
      project: {
        select: { id: true, name: true },
      },
      process: {
        select: { id: true, name: true },
      },
      task: {
        select: { id: true, title: true },
      },
      owner: {
        select: { id: true, fullName: true },
      },
    },
    orderBy: [
      { severity: "desc" },
      { dueDate: "asc" },
      { createdAt: "desc" },
    ],
    take: 20,
  });
}

module.exports = {
  findProjectsForOverview,
  findTasksForOverview,
  findProcessesForOverview,
  groupTasksByProjectAndStatus,
  findTasksForMyOverview,
  findScopedProjects,
  findOpenCorrectiveActions,
};
