const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const ApiError = require("../utils/apiError");

const selectShape = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  createdAt: true,
};

async function listUsers() {
  return prisma.user.findMany({
    select: selectShape,
    orderBy: { createdAt: "desc" },
  });
}

async function createUser(payload) {
  const existing = await prisma.user.findUnique({ where: { email: payload.email } });
  if (existing) {
    throw new ApiError(409, "Email already exists");
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);

  return prisma.user.create({
    data: {
      fullName: payload.fullName,
      email: payload.email,
      role: payload.role,
      passwordHash,
    },
    select: selectShape,
  });
}

async function updateUser(id, payload) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "User not found");
  }

  const data = { ...payload };
  if (payload.password) {
    data.passwordHash = await bcrypt.hash(payload.password, 10);
    delete data.password;
  }

  return prisma.user.update({
    where: { id },
    data,
    select: selectShape,
  });
}

async function deleteUser(id) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "User not found");
  }

  await prisma.user.delete({ where: { id } });
}

module.exports = { listUsers, createUser, updateUser, deleteUser };
