const prisma = require("../config/prisma");
const ApiError = require("../utils/apiError");

const DB_TIMEOUT_MS = 6000;

async function withDbTimeout(promise) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Database request timeout")), DB_TIMEOUT_MS);
    }),
  ]);
}

function modelAvailable() {
  return prisma && prisma.user && typeof prisma.user.findUnique === "function";
}

async function findByEmail(email) {
  if (!modelAvailable()) throw new ApiError(503, "Database not configured or unreachable");
  try {
    return await withDbTimeout(prisma.user.findUnique({ where: { email } }));
  } catch (err) {
    throw new ApiError(503, `Database error: ${err.message}`);
  }
}

async function findById(id) {
  if (!modelAvailable()) throw new ApiError(503, "Database not configured or unreachable");
  try {
    return await withDbTimeout(prisma.user.findUnique({ where: { id } }));
  } catch (err) {
    throw new ApiError(503, `Database error: ${err.message}`);
  }
}

async function createUser(data) {
  if (!modelAvailable()) throw new ApiError(503, "Database not configured or unreachable");
  try {
    return await withDbTimeout(prisma.user.create({ data }));
  } catch (err) {
    throw new ApiError(503, `Database error: ${err.message}`);
  }
}

async function listUsers(select) {
  if (!modelAvailable()) throw new ApiError(503, "Database not configured or unreachable");
  try {
    return await withDbTimeout(prisma.user.findMany({
      select: select || {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }));
  } catch (err) {
    throw new ApiError(503, `Database error: ${err.message}`);
  }
}

module.exports = {
  findByEmail,
  findById,
  createUser,
  listUsers,
};
