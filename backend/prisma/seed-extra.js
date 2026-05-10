const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const passwordHash = "$2a$10$zFQ2kM5FQvVQHjYifbJvQeCZbZs3h/8pS1y5t9xk3i5wTtUu9nY7K"; // Password123!

  const users = await Promise.all(
    Array.from({ length: 7 }).map((_, index) => {
      const i = index + 1;
      return prisma.user.upsert({
        where: { email: `seed.user${i}@esi.edu` },
        update: {},
        create: {
          fullName: `Seed User ${i}`,
          email: `seed.user${i}@esi.edu`,
          passwordHash,
          role: i % 2 === 0 ? "PROJECT_MANAGER" : "TEAM_MEMBER",
        },
      });
    }),
  );

  const projects = await Promise.all(
    Array.from({ length: 7 }).map((_, index) => {
      const i = index + 1;
      return prisma.project.create({
        data: {
          name: `Seed Project ${i}`,
          description: `Additional seeded project ${i} for production data set.`,
          ownerId: users[index % users.length].id,
          status: i % 3 === 0 ? "DELAYED" : i % 3 === 1 ? "IN_PROGRESS" : "PLANNED",
          startDate: new Date(2026, 0, i + 1),
          endDate: new Date(2026, 6, i + 5),
        },
      });
    }),
  );

  const processes = await Promise.all(
    Array.from({ length: 7 }).map((_, index) => {
      const i = index + 1;
      return prisma.process.create({
        data: {
          name: `Seed Process ${i}`,
          description: `Additional seeded process ${i}.`,
          responsiblePerson: `Responsible ${i}`,
          objectives: [`Objective ${i}-A`, `Objective ${i}-B`],
          inputs: [`Input ${i}-A`, `Input ${i}-B`],
          outputs: [`Output ${i}-A`, `Output ${i}-B`],
          knowledgeItems: [`Knowledge ${i}-A`, `Knowledge ${i}-B`],
          indicators: [
            { name: `Indicator ${i}-1`, target: 100, current: 60 + i, unit: "%" },
            { name: `Indicator ${i}-2`, target: 30, current: 20 + i, unit: "days" },
          ],
        },
      });
    }),
  );

  await prisma.projectProcess.createMany({
    data: projects.map((project, index) => ({
      projectId: project.id,
      processId: processes[index].id,
    })),
  });

  const tasks = await Promise.all(
    processes.map((process, index) => {
      const i = index + 1;
      return prisma.task.create({
        data: {
          title: `Seed Task ${i}`,
          description: `Task ${i} generated for seeded dataset.`,
          status: i % 2 === 0 ? "IN_PROGRESS" : "TODO",
          dueDate: new Date(2026, 4, i + 5),
          plannedHours: 8 + i,
          actualHours: i % 2 === 0 ? 4 + i : null,
          assigneeId: users[index % users.length].id,
          projectId: projects[index].id,
          processId: process.id,
        },
      });
    }),
  );

  await prisma.document.createMany({
    data: tasks.map((task, index) => ({
      name: `seed-doc-${index + 1}.pdf`,
      mimeType: "application/pdf",
      size: 120000 + index * 1000,
      path: `uploads/seed-doc-${index + 1}.pdf`,
      taskId: task.id,
      processId: processes[index].id,
      uploadedById: users[index % users.length].id,
    })),
  });

  await prisma.kpi.createMany({
    data: processes.map((process, index) => ({
      name: `Seed KPI ${index + 1}`,
      description: `Additional KPI ${index + 1}.`,
      target: 100,
      current: 55 + index,
      unit: "%",
      processId: process.id,
    })),
  });

  const nonConformities = await Promise.all(
    processes.map((process, index) => {
      const i = index + 1;
      return prisma.nonConformity.create({
        data: {
          title: `Seed Nonconformity ${i}`,
          description: `Seeded nonconformity ${i} for testing.`,
          status: i % 2 === 0 ? "ANALYSIS" : "OPEN",
          severity: i % 3 === 0 ? "HIGH" : "MEDIUM",
          detectedAt: new Date(2026, 3, i + 2),
          processId: process.id,
          detectedById: users[index % users.length].id,
        },
      });
    }),
  );

  await prisma.correctiveAction.createMany({
    data: nonConformities.map((nc, index) => ({
      title: `Seed Corrective Action ${index + 1}`,
      description: `Corrective action for seeded NC ${index + 1}.`,
      recommendation: `Recommendation ${index + 1}`,
      actionType: index % 2 === 0 ? "CORRECTIVE" : "PREVENTIVE",
      status: index % 2 === 0 ? "IN_PROGRESS" : "OPEN",
      severity: index % 3 === 0 ? "HIGH" : "MEDIUM",
      source: "MANUAL",
      rootCause: `Root cause ${index + 1}`,
      containmentAction: `Containment ${index + 1}`,
      effectivenessCriteria: `Effectiveness ${index + 1}`,
      effectivenessStatus: "PENDING",
      nonConformityId: nc.id,
      projectId: projects[index].id,
      processId: processes[index].id,
      taskId: tasks[index].id,
      ownerId: users[index % users.length].id,
      createdById: users[(index + 1) % users.length].id,
      dueDate: new Date(2026, 5, index + 10),
    })),
  });

  const criteria = await prisma.criterion.findMany({
    orderBy: { code: "asc" },
    take: 7,
  });

  if (criteria.length) {
    const processCriteria = await Promise.all(
      processes.map((process, index) =>
        prisma.processCriterion.create({
          data: {
            processId: process.id,
            criterionId: criteria[index % criteria.length].id,
            selected: true,
            score: 60 + index,
            rate: 70 + index,
            veracityLevel: index % 2 === 0 ? "RATHER_TRUE" : "RATHER_FALSE",
            notes: `Seeded assessment ${index + 1}`,
          },
        }),
      ),
    );

    await prisma.criterionEvidence.createMany({
      data: processCriteria.map((pc, index) => ({
        processCriterionId: pc.id,
        type: "record",
        description: `Seeded evidence ${index + 1}`,
        url: `https://example.com/evidence/${index + 1}`,
      })),
    });
  }

  console.log("Seed extra completed: added 7 records per entity.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
