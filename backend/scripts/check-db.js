const prisma = require("../src/config/prisma");

async function main() {
  const startedAt = Date.now();

  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    console.log(`DB_OK (${Date.now() - startedAt}ms)`);
    process.exitCode = 0;
  } catch (error) {
    console.error("DB_FAIL", error?.message || error);
    process.exitCode = 1;
  } finally {
    try {
      await prisma.$disconnect();
    } catch {
      // no-op
    }
  }
}

main();
