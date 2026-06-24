const prisma = require("../config/prisma");
const ApiError = require("../utils/apiError");
const { computeProcessProgressSnapshot } = require("./process-progress.service");

function includeShape() {
  return {};
}

function listIncludeShape() {
  return {};
}

async function listProcesses() {
  const processes = await prisma.process.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      objectives: true,
      responsiblePerson: true,
      inputs: true,
      outputs: true,
      knowledgeItems: true,
      indicators: true,
      createdAt: true,
      updatedAt: true,
    },
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
  const process = await prisma.process.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      objectives: true,
      responsiblePerson: true,
      inputs: true,
      outputs: true,
      knowledgeItems: true,
      indicators: true,
      createdAt: true,
      updatedAt: true,
    },
  });
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

async function listDepartments() {
  return [];
}

async function createDepartment() {
  throw new ApiError(501, "Department management is not available for the current database schema.");
}

async function createProcess(data) {
  return prisma.process.create({
    data,
    select: {
      id: true,
      name: true,
      description: true,
      objectives: true,
      responsiblePerson: true,
      inputs: true,
      outputs: true,
      knowledgeItems: true,
      indicators: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

async function updateProcess(id, data) {
  await getProcessById(id);
  return prisma.process.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      description: true,
      objectives: true,
      responsiblePerson: true,
      inputs: true,
      outputs: true,
      knowledgeItems: true,
      indicators: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

async function deleteProcess(id) {
  await getProcessById(id);
  await prisma.process.delete({ where: { id } });
}

module.exports = {
  listProcesses,
  listDepartments,
  createDepartment,
  getProcessById,
  createProcess,
  updateProcess,
  deleteProcess,
};
