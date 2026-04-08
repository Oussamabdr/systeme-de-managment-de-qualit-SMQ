const prisma = require("../config/prisma");
const ApiError = require("../utils/apiError");

async function createDocument(data) {
  return prisma.document.create({
    data,
    include: {
      task: true,
      process: true,
      uploadedBy: {
        select: { id: true, fullName: true, email: true },
      },
    },
  });
}

async function listDocuments() {
  return prisma.document.findMany({
    include: {
      task: {
        select: { id: true, title: true },
      },
      process: {
        select: { id: true, name: true },
      },
      uploadedBy: {
        select: { id: true, fullName: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function listDocumentsForUser(user) {
  if (user.role !== "TEAM_MEMBER") {
    return listDocuments();
  }

  return prisma.document.findMany({
    where: {
      OR: [{ uploadedById: user.id }, { task: { assigneeId: user.id } }],
    },
    include: {
      task: {
        select: { id: true, title: true },
      },
      process: {
        select: { id: true, name: true },
      },
      uploadedBy: {
        select: { id: true, fullName: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function validateUploadScopeForUser(user, payload) {
  if (user.role !== "TEAM_MEMBER") {
    return;
  }

  // Team members can only upload evidence linked to their own assigned tasks.
  if (!payload.taskId || payload.processId) {
    throw new ApiError(403, "Team members can only upload documents to their own tasks");
  }

  const task = await prisma.task.findUnique({ where: { id: payload.taskId } });
  if (!task || task.assigneeId !== user.id) {
    throw new ApiError(403, "You can only upload documents for your assigned tasks");
  }
}

module.exports = { createDocument, listDocuments, listDocumentsForUser, validateUploadScopeForUser };
