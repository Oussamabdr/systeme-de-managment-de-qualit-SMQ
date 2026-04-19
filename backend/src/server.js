const app = require("./app");
const env = require("./config/env");
const prisma = require("./config/prisma");

async function startupDbHealthCheck() {
  try {
    const startedAt = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    // Warm the Prisma query engine with a model query to avoid first-request latency.
    await prisma.user.findFirst({ select: { id: true } });
    console.log(`Database health check passed (${Date.now() - startedAt}ms).`);
  } catch (error) {
    console.error(
      "Database health check failed on startup. API will run, but DB requests may fail. Check DATABASE_URL and local Prisma/Postgres process.",
    );
    console.error(error?.message || error);
  }
}

async function shutdown(signal) {
  try {
    await prisma.$disconnect();
  } finally {
    process.exit(0);
  }
}

async function startServer() {
  await startupDbHealthCheck();

  app.listen(env.port, () => {
    // Startup log intentionally concise for local and containerized runs.
    console.log(`QMS API listening on port ${env.port}`);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer().catch((error) => {
  console.error("Fatal server startup error", error);
  process.exit(1);
});
