const path = require("path");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const prisma = new PrismaClient();

async function main() {
  const [taskCount, statusCounts, projectCount, processCount] = await Promise.all([
    prisma.task.count(),
    prisma.task.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.project.count(),
    prisma.process.count(),
  ]);

  console.log({ taskCount, statusCounts, projectCount, processCount });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
