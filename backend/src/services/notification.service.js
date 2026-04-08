const prisma = require("../config/prisma");

async function getNotifications(user) {
  const now = new Date();

  if (user?.role === "TEAM_MEMBER") {
    const [overdueTasks, delayedProjectTasks] = await Promise.all([
      prisma.task.findMany({
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
      }),
      prisma.task.findMany({
        where: {
          assigneeId: user.id,
          project: { status: "DELAYED" },
        },
        select: {
          project: {
            select: { id: true, name: true, status: true },
          },
        },
      }),
    ]);

    const delayedProjectsMap = new Map();
    for (const row of delayedProjectTasks) {
      if (row.project) {
        delayedProjectsMap.set(row.project.id, row.project);
      }
    }

    return {
      overdueTasks,
      delayedProjects: [...delayedProjectsMap.values()],
    };
  }

  const [overdueTasks, delayedProjects] = await Promise.all([
    prisma.task.findMany({
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
    }),
    prisma.project.findMany({
      where: { status: "DELAYED" },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return {
    overdueTasks,
    delayedProjects,
  };
}

module.exports = { getNotifications };
