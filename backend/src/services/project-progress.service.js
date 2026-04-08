const prisma = require("../config/prisma");
const ApiError = require("../utils/apiError");

function computeStatus({ progress, endDate }) {
  if (progress === 100) return "Completed";

  const now = new Date();
  if (!endDate) return "On Track";

  const deadline = new Date(endDate);
  if (now > deadline && progress < 100) return "Delayed";

  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
  if (deadline.getTime() - now.getTime() <= threeDaysMs && progress < 70) {
    return "At Risk";
  }

  return "On Track";
}

function computeProgressSnapshot(project) {
  const tasks = project.tasks || [];
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === "DONE").length;
  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const status = computeStatus({ progress, endDate: project.endDate });

  return {
    progress,
    status,
    completedTasks,
    totalTasks,
  };
}

async function computeProjectProgress(projectId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { tasks: true },
  });

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  return computeProgressSnapshot(project);
}

module.exports = {
  computeProjectProgress,
  computeProgressSnapshot,
  computeStatus,
};
