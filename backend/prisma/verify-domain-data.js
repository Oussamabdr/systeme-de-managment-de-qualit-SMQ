const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const targetProjects = [
    "ISO 9001 Certification Wave 2",
    "Document Digitalization Program",
    "Supplier Quality Assurance",
  ];

  const projects = await prisma.project.findMany({
    where: { name: { in: targetProjects } },
    include: {
      processes: {
        include: {
          process: true,
        },
      },
      tasks: {
        include: {
          assignee: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
      },
    },
  });

  const summary = projects.map((project) => ({
    project: project.name,
    processCount: project.processes.length,
    processes: project.processes.map((row) => row.process.name),
    taskCount: project.tasks.length,
    taskTitles: project.tasks.map((task) => ({
      title: task.title,
      assignee: task.assignee?.email || null,
      status: task.status,
    })),
  }));

  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
