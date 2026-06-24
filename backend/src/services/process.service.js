const prisma = require("../config/prisma");
const ApiError = require("../utils/apiError");
const { computeProcessProgressSnapshot } = require("./process-progress.service");

function includeShape() {
  return {
    department: true,
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
    department: true,
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
  await ensureDefaultDepartments();
  const processes = await prisma.process.findMany({
    include: listIncludeShape(),
    orderBy: [{ department: { name: "asc" } }, { createdAt: "desc" }],
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

async function ensureDefaultDepartments() {
  const defaults = [
    { code: "DPGR", name: "DPGR" },
    { code: "DG", name: "DG" },
    { code: "LABO", name: "Labo" },
    { code: "DE", name: "DE" },
  ];

  await Promise.all(defaults.map((department) => prisma.department.upsert({
    where: { code: department.code },
    update: {},
    create: department,
  })));
}

async function listDepartments() {
  await ensureDefaultDepartments();
  return prisma.department.findMany({
    include: { _count: { select: { processes: true } } },
    orderBy: { name: "asc" },
  });
}

async function createDepartment(data) {
  const code = data.code || data.name;
  return prisma.department.create({
    data: {
      name: data.name.trim(),
      code: code.trim().toUpperCase().replace(/\s+/g, "_"),
    },
  });
}

async function createProcess(data) {
  await ensureDefaultDepartments();
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
  listDepartments,
  createDepartment,
  getProcessById,
  createProcess,
  updateProcess,
  deleteProcess,
};
