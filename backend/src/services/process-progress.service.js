const prisma = require("../config/prisma");
const ApiError = require("../utils/apiError");
const { computeStatus } = require("./project-progress.service");

function deriveProcessDeadline(tasks) {
  const deadlines = (tasks || [])
    .map((task) => task.dueDate)
    .filter(Boolean)
    .map((value) => new Date(value));

  if (deadlines.length === 0) {
    return null;
  }

  return new Date(Math.max(...deadlines.map((deadline) => deadline.getTime())));
}

function computeProcessProgressSnapshot(process) {
  const tasks = process.tasks || [];
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === "DONE").length;
  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const endDate = deriveProcessDeadline(tasks);
  const status = computeStatus({ progress, endDate });

  return {
    progress,
    status,
    completedTasks,
    totalTasks,
    endDate,
  };
}

async function computeProcessProgress(processId) {
  const process = await prisma.process.findUnique({
    where: { id: processId },
    include: {
      tasks: {
        select: {
          id: true,
          status: true,
          dueDate: true,
        },
      },
    },
  });

  if (!process) {
    throw new ApiError(404, "Process not found");
  }

  return computeProcessProgressSnapshot(process);
}

module.exports = {
  computeProcessProgress,
  computeProcessProgressSnapshot,
};
