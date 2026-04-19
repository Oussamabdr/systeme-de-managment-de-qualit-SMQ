const prisma = require("../config/prisma");
const ApiError = require("../utils/apiError");

const includeShape = {
  process: {
    select: { id: true, name: true },
  },
  detectedBy: {
    select: { id: true, fullName: true, email: true, role: true },
  },
  correctiveActions: {
    select: {
      id: true,
      title: true,
      status: true,
      severity: true,
      dueDate: true,
    },
    orderBy: [{ severity: "desc" }, { dueDate: "asc" }],
  },
};

async function ensureProcessExists(processId) {
  if (!processId) return;
  const process = await prisma.process.findUnique({ where: { id: processId }, select: { id: true } });
  if (!process) throw new ApiError(400, "Process not found");
}

async function assertCanCloseNonConformity(id, payload) {
  if (payload.status !== "CLOSED") return;

  const actions = await prisma.correctiveAction.findMany({
    where: { nonConformityId: id },
    select: { status: true, effectivenessStatus: true },
  });

  const invalid = actions.find((action) => action.status !== "DONE" || action.effectivenessStatus !== "VERIFIED");
  if (invalid) {
    throw new ApiError(400, "Cannot close non-conformity while linked CAPA are not DONE and VERIFIED");
  }
}

function buildWhere(filters) {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.severity) where.severity = filters.severity;
  if (filters.processId) where.processId = filters.processId;
  return where;
}

async function listNonConformities(filters = {}) {
  const where = buildWhere(filters);
  return prisma.nonConformity.findMany({
    where,
    include: includeShape,
    orderBy: [{ severity: "desc" }, { detectedAt: "desc" }],
  });
}

async function getNonConformityById(id) {
  const item = await prisma.nonConformity.findUnique({
    where: { id },
    include: includeShape,
  });

  if (!item) throw new ApiError(404, "Non-conformity not found");
  return item;
}

async function createNonConformity(payload, user) {
  await ensureProcessExists(payload.processId);

  return prisma.nonConformity.create({
    data: {
      ...payload,
      detectedById: user.id,
    },
    include: includeShape,
  });
}

async function updateNonConformity(id, payload) {
  await getNonConformityById(id);
  await ensureProcessExists(payload.processId);
  await assertCanCloseNonConformity(id, payload);

  return prisma.nonConformity.update({
    where: { id },
    data: payload,
    include: includeShape,
  });
}

async function deleteNonConformity(id) {
  await getNonConformityById(id);

  const linkedActions = await prisma.correctiveAction.count({
    where: { nonConformityId: id },
  });

  if (linkedActions > 0) {
    throw new ApiError(400, "Cannot delete non-conformity with linked CAPA actions");
  }

  await prisma.nonConformity.delete({ where: { id } });
}

module.exports = {
  listNonConformities,
  getNonConformityById,
  createNonConformity,
  updateNonConformity,
  deleteNonConformity,
};
