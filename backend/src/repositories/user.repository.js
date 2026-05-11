const prisma = require("../config/prisma");
const ApiError = require("../utils/apiError");

const DB_TIMEOUT_MS = 6000;
let authSchemaReadyPromise;

async function withDbTimeout(promise) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Database request timeout")), DB_TIMEOUT_MS);
    }),
  ]);
}

async function ensureAuthSchema() {
  if (!authSchemaReadyPromise) {
    authSchemaReadyPromise = (async () => {
      // Emergency bootstrap for environments where migrations were not applied yet.
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          CREATE TYPE "Role" AS ENUM ('ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER', 'CAQ');
        EXCEPTION
          WHEN duplicate_object THEN NULL;
        END
        $$;
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "User" (
          "id" TEXT NOT NULL,
          "fullName" TEXT NOT NULL,
          "email" TEXT NOT NULL,
          "passwordHash" TEXT NOT NULL,
          "role" "Role" NOT NULL DEFAULT 'TEAM_MEMBER',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "User_pkey" PRIMARY KEY ("id")
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
      `);
    })().catch((err) => {
      authSchemaReadyPromise = undefined;
      throw err;
    });
  }

  return withDbTimeout(authSchemaReadyPromise);
}

function modelAvailable() {
  return prisma && prisma.user && typeof prisma.user.findUnique === "function";
}

async function findByEmail(email) {
  if (!modelAvailable()) throw new ApiError(503, "Database not configured or unreachable");
  try {
    await ensureAuthSchema();
    return await withDbTimeout(prisma.user.findUnique({ where: { email } }));
  } catch (err) {
    throw new ApiError(503, `Database error: ${err.message}`);
  }
}

async function findById(id) {
  if (!modelAvailable()) throw new ApiError(503, "Database not configured or unreachable");
  try {
    await ensureAuthSchema();
    return await withDbTimeout(prisma.user.findUnique({ where: { id } }));
  } catch (err) {
    throw new ApiError(503, `Database error: ${err.message}`);
  }
}

async function createUser(data) {
  if (!modelAvailable()) throw new ApiError(503, "Database not configured or unreachable");
  try {
    await ensureAuthSchema();
    return await withDbTimeout(prisma.user.create({ data }));
  } catch (err) {
    throw new ApiError(503, `Database error: ${err.message}`);
  }
}

async function listUsers(select) {
  if (!modelAvailable()) throw new ApiError(503, "Database not configured or unreachable");
  try {
    await ensureAuthSchema();
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
