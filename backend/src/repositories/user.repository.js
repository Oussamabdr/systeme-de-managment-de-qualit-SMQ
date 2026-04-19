const prisma = require("../config/prisma");

async function findByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

async function findById(id) {
  return prisma.user.findUnique({ where: { id } });
}

async function createUser(data) {
  return prisma.user.create({ data });
}

async function listUsers(select) {
  return prisma.user.findMany({
    select: select || {
      id: true,
      fullName: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

module.exports = {
  findByEmail,
  findById,
  createUser,
  listUsers,
};
