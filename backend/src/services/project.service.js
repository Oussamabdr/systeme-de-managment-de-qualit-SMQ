const prisma = require("../config/prisma");
const ApiError = require("../utils/apiError");
const { computeProgressSnapshot } = require("./project-progress.service");

const includeShape = {
  processes: {
    include: {
      process: true,
    },
  },
  tasks: {
    include: {
      assignee: {
        select: { id: true, fullName: true, email: true, role: true },
      },
    },
  },
};

async function listProjects() {
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      ownerId: true,
      status: true,
      startDate: true,
      endDate: true,
      createdAt: true,
      updatedAt: true,
      processes: {
        select: {
          processId: true,
        },
      },
      tasks: {
        select: {
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return projects.map((project) => {
    const snapshot = computeProgressSnapshot(project);
    return {
      ...project,
      progress: snapshot.progress,
      computedStatus: snapshot.status,
      completedTasks: snapshot.completedTasks,
      totalTasks: snapshot.totalTasks,
    };
  });
}

async function getProjectById(id) {
  const project = await prisma.project.findUnique({ where: { id }, include: includeShape });
  if (!project) throw new ApiError(404, "Project not found");
  const snapshot = computeProgressSnapshot(project);
  return {
    ...project,
    progress: snapshot.progress,
    computedStatus: snapshot.status,
    completedTasks: snapshot.completedTasks,
    totalTasks: snapshot.totalTasks,
  };
}

async function createProject(data) {
  const payload = { ...data };
  delete payload.status;
  const project = await prisma.project.create({ data: payload, include: includeShape });
  const snapshot = computeProgressSnapshot(project);
  return {
    ...project,
    progress: snapshot.progress,
    computedStatus: snapshot.status,
    completedTasks: snapshot.completedTasks,
    totalTasks: snapshot.totalTasks,
  };
}

async function updateProject(id, data) {
  await getProjectById(id);
  const payload = { ...data };
  delete payload.status;
  const project = await prisma.project.update({ where: { id }, data: payload, include: includeShape });
  const snapshot = computeProgressSnapshot(project);
  return {
    ...project,
    progress: snapshot.progress,
    computedStatus: snapshot.status,
    completedTasks: snapshot.completedTasks,
    totalTasks: snapshot.totalTasks,
  };
}

async function deleteProject(id) {
  await getProjectById(id);
  await prisma.project.delete({ where: { id } });
}

async function assignProcesses(projectId, processIds) {
  await getProjectById(projectId);

  await prisma.projectProcess.deleteMany({ where: { projectId } });
  if (processIds.length > 0) {
    await prisma.projectProcess.createMany({
      data: processIds.map((processId) => ({ projectId, processId })),
      skipDuplicates: true,
    });
  }

  return getProjectById(projectId);
}

module.exports = {
  listProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  assignProcesses,
};
