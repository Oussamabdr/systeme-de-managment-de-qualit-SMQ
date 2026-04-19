const prisma = require("../config/prisma");
const ApiError = require("../utils/apiError");
const { computeProcessProgressSnapshot } = require("./process-progress.service");

function includeShape() {
  return {
    projects: {
      include: {
        project: true,
      },
    },
    _count: {
      select: { tasks: true, documents: true },
    },
    tasks: {
      select: {
        id: true,
        status: true,
        dueDate: true,
      },
    },
  };
}

function listIncludeShape() {
  return {
    _count: {
      select: { tasks: true, documents: true },
    },
    tasks: {
      select: {
        id: true,
        status: true,
        dueDate: true,
      },
    },
  };
}

async function listProcesses() {
  const processes = await prisma.process.findMany({
    include: listIncludeShape(),
    orderBy: { createdAt: "desc" },
  });
  return processes.map((process) => {
    const snapshot = computeProcessProgressSnapshot(process);
    return {
      ...process,
      progress: snapshot.progress,
      computedStatus: snapshot.status,
      completedTasks: snapshot.completedTasks,
      totalTasks: snapshot.totalTasks,
      computedEndDate: snapshot.endDate,
    };
  });
}

async function getProcessById(id) {
  const process = await prisma.process.findUnique({ where: { id }, include: includeShape() });
  if (!process) throw new ApiError(404, "Process not found");
  const snapshot = computeProcessProgressSnapshot(process);
  return {
    ...process,
    progress: snapshot.progress,
    computedStatus: snapshot.status,
    completedTasks: snapshot.completedTasks,
    totalTasks: snapshot.totalTasks,
    computedEndDate: snapshot.endDate,
  };
}

async function createProcess(data) {
  return prisma.process.create({ data, include: includeShape() });
}

async function updateProcess(id, data) {
  await getProcessById(id);
  return prisma.process.update({ where: { id }, data, include: includeShape() });
}

async function deleteProcess(id) {
  await getProcessById(id);
  await prisma.process.delete({ where: { id } });
}

module.exports = {
  listProcesses,
  getProcessById,
  createProcess,
  updateProcess,
  deleteProcess,
};
