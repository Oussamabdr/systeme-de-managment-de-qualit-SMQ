const prisma = require("../config/prisma");
const ApiError = require("../utils/apiError");

const includeShape = {
  assignee: {
    select: { id: true, fullName: true, email: true, role: true },
  },
  process: true,
  project: true,
  documents: true,
};

async function listTasks(filters = {}) {
  const where = {};
  if (filters.projectId) where.projectId = filters.projectId;
  if (filters.processId) where.processId = filters.processId;
  if (filters.assigneeId) where.assigneeId = filters.assigneeId;

  return prisma.task.findMany({
    where,
    include: includeShape,
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });
}

function assertTaskVisibility(task, user) {
  if (!user) throw new ApiError(401, "Unauthorized");
  if (user.role === "TEAM_MEMBER" && task.assigneeId !== user.id) {
    throw new ApiError(403, "Forbidden");
  }
}

function assertTeamMemberUpdatePolicy(payload) {
  const allowedKeys = ["status"];
  const keys = Object.keys(payload || {});
  const hasForbiddenKey = keys.some((key) => !allowedKeys.includes(key));
  if (hasForbiddenKey) {
    throw new ApiError(403, "Team members can only update task status");
  }
}

async function getTaskById(id) {
  const task = await prisma.task.findUnique({ where: { id }, include: includeShape });
  if (!task) throw new ApiError(404, "Task not found");
  return task;
}

async function listTasksForUser(user, filters = {}) {
  const scopedFilters = { ...filters };
  if (user.role === "TEAM_MEMBER") {
    scopedFilters.assigneeId = user.id;
  }
  return listTasks(scopedFilters);
}

async function getTaskByIdForUser(id, user) {
  const task = await getTaskById(id);
  assertTaskVisibility(task, user);
  return task;
}

async function createTask(data) {
  const payload = { ...data };
  const actor = payload.__user;
  delete payload.__user;

  if (!actor || actor.role !== "PROJECT_MANAGER") {
    throw new ApiError(403, "Only project managers can create tasks");
  }

  if (payload.status === "IN_PROGRESS") {
    payload.startedAt = new Date();
  }
  if (payload.status === "DONE") {
    payload.completedAt = new Date();
  }
  return prisma.task.create({ data: payload, include: includeShape });
}

async function updateTask(id, data) {
  const task = await getTaskById(id);
  const user = data.__user;
  const payload = { ...data };
  delete payload.__user;

  if (!user || !["PROJECT_MANAGER", "TEAM_MEMBER"].includes(user.role)) {
    throw new ApiError(403, "Only project managers or assigned team members can update tasks");
  }

  if (user?.role === "TEAM_MEMBER") {
    assertTaskVisibility(task, user);
    assertTeamMemberUpdatePolicy(payload);
  }

  if (user?.role === "PROJECT_MANAGER") {
    // Managers are the only role allowed to assign or reassign tasks.
    if (Object.prototype.hasOwnProperty.call(payload, "assigneeId")) {
      payload.assigneeId = payload.assigneeId || null;
    }
  }

  if (payload.status === "IN_PROGRESS") {
    payload.startedAt = new Date();
    payload.completedAt = null;
  }

  if (payload.status === "DONE") {
    payload.completedAt = new Date();
    if (!payload.startedAt) payload.startedAt = new Date();
  }

  if (payload.status === "TODO") {
    payload.startedAt = null;
    payload.completedAt = null;
  }

  return prisma.task.update({ where: { id }, data: payload, include: includeShape });
}

async function deleteTask(id) {
  await getTaskById(id);
  await prisma.task.delete({ where: { id } });
}

async function kanban(projectId) {
  const tasks = await prisma.task.findMany({
    where: projectId ? { projectId } : undefined,
    include: includeShape,
    orderBy: { createdAt: "desc" },
  });

  return {
    TODO: tasks.filter((t) => t.status === "TODO"),
    IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS"),
    DONE: tasks.filter((t) => t.status === "DONE"),
  };
}

async function kanbanForUser(user, projectId) {
  const where = {};
  if (projectId) where.projectId = projectId;
  if (user.role === "TEAM_MEMBER") where.assigneeId = user.id;

  const tasks = await prisma.task.findMany({
    where,
    include: includeShape,
    orderBy: { createdAt: "desc" },
  });

  return {
    TODO: tasks.filter((t) => t.status === "TODO"),
    IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS"),
    DONE: tasks.filter((t) => t.status === "DONE"),
  };
}

module.exports = {
  listTasks,
  listTasksForUser,
  getTaskById,
  getTaskByIdForUser,
  createTask,
  updateTask,
  deleteTask,
  kanban,
  kanbanForUser,
};
