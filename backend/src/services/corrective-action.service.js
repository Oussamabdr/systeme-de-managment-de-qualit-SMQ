const prisma = require("../config/prisma");
const ApiError = require("../utils/apiError");

const includeShape = {
  nonConformity: {
    select: { id: true, title: true, status: true },
  },
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
    select: { id: true, fullName: true, email: true, role: true },
  },
  createdBy: {
    select: { id: true, fullName: true, email: true, role: true },
  },
  verifiedBy: {
    select: { id: true, fullName: true, email: true, role: true },
  },
};

async function ensureEntityExists(model, id, label) {
  if (!id) return;
  const found = await prisma[model].findUnique({ where: { id }, select: { id: true } });
  if (!found) throw new ApiError(400, `${label} not found`);
}

async function getUserRole(userId) {
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  return user?.role || null;
}

function buildWhere(filters, user) {
  const where = {};

  if (filters.status) where.status = filters.status;
  if (filters.severity) where.severity = filters.severity;
  if (filters.projectId) where.projectId = filters.projectId;
  if (filters.processId) where.processId = filters.processId;
  if (filters.ownerId) where.ownerId = filters.ownerId;
  if (filters.nonConformityId) where.nonConformityId = filters.nonConformityId;
  if (filters.effectivenessStatus) where.effectivenessStatus = filters.effectivenessStatus;

  if (filters.mine === "true") {
    where.OR = [{ ownerId: user.id }, { createdById: user.id }];
  }

  return where;
}

async function assertIsoClosureRules(payload, user, existingAction) {
  const nextStatus = payload.status || existingAction.status;
  if (nextStatus !== "DONE") return;

  const rootCause = payload.rootCause ?? existingAction.rootCause;
  const effectivenessCriteria = payload.effectivenessCriteria ?? existingAction.effectivenessCriteria;
  const effectivenessStatus = payload.effectivenessStatus ?? existingAction.effectivenessStatus;
  const verifiedById = payload.verifiedById ?? existingAction.verifiedById;
  const actorRole = user?.role;

  if (!rootCause) {
    throw new ApiError(400, "Root cause is required before closing a corrective action");
  }

  if (!effectivenessCriteria) {
    throw new ApiError(400, "Effectiveness criteria is required before closure");
  }

  if (effectivenessStatus !== "VERIFIED") {
    throw new ApiError(400, "Corrective action can be closed only when effectiveness is VERIFIED");
  }

  if (!verifiedById) {
    throw new ApiError(400, "Verifier is required before closure");
  }

  const verifierRole = await getUserRole(verifiedById);
  if (!verifierRole || !["ADMIN", "CAQ"].includes(verifierRole)) {
    throw new ApiError(400, "Verifier must be an ADMIN or CAQ user");
  }

  if (!["ADMIN", "CAQ"].includes(actorRole)) {
    throw new ApiError(403, "Only ADMIN or CAQ can validate effectiveness and close corrective actions");
  }
}

async function listActions(filters, user) {
  const where = buildWhere(filters, user);
  return prisma.correctiveAction.findMany({
    where,
    include: includeShape,
    orderBy: [{ severity: "desc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });
}

async function getActionById(id) {
  const action = await prisma.correctiveAction.findUnique({
    where: { id },
    include: includeShape,
  });

  if (!action) throw new ApiError(404, "Corrective action not found");
  return action;
}

async function createAction(payload, user) {
  await ensureEntityExists("project", payload.projectId, "Project");
  await ensureEntityExists("process", payload.processId, "Process");
  await ensureEntityExists("task", payload.taskId, "Task");
  await ensureEntityExists("user", payload.ownerId, "Owner");
  await ensureEntityExists("nonConformity", payload.nonConformityId, "Non-conformity");
  await ensureEntityExists("user", payload.verifiedById, "Verifier");

  await assertIsoClosureRules(payload, user, {
    status: "OPEN",
    rootCause: null,
    effectivenessCriteria: null,
    effectivenessStatus: "PENDING",
    verifiedById: null,
  });

  const data = {
    ...payload,
    createdById: user.id,
  };

  if (data.effectivenessStatus === "VERIFIED" && !data.verifiedAt) {
    data.verifiedAt = new Date();
  }

  return prisma.correctiveAction.create({
    data,
    include: includeShape,
  });
}

async function updateAction(id, payload, user) {
  const existingAction = await getActionById(id);

  await assertIsoClosureRules(payload, user, existingAction);

  const data = { ...payload };

  await ensureEntityExists("project", data.projectId, "Project");
  await ensureEntityExists("process", data.processId, "Process");
  await ensureEntityExists("task", data.taskId, "Task");
  await ensureEntityExists("user", data.ownerId, "Owner");
  await ensureEntityExists("nonConformity", data.nonConformityId, "Non-conformity");
  await ensureEntityExists("user", data.verifiedById, "Verifier");

  if (data.effectivenessStatus === "VERIFIED" && !data.verifiedAt) {
    data.verifiedAt = new Date();
  }

  return prisma.correctiveAction.update({
    where: { id },
    data,
    include: includeShape,
  });
}

async function deleteAction(id) {
  await getActionById(id);
  await prisma.correctiveAction.delete({ where: { id } });
}

module.exports = {
  listActions,
  getActionById,
  createAction,
  updateAction,
  deleteAction,
};
