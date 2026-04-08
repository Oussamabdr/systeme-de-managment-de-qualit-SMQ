const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.document.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectProcess.deleteMany();
  await prisma.process.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Password123!", 10);

  const [admin, manager, member] = await Promise.all([
    prisma.user.create({
      data: {
        fullName: "System Admin",
        email: "admin@esi.edu",
        passwordHash,
        role: "ADMIN",
      },
    }),
    prisma.user.create({
      data: {
        fullName: "Project Manager",
        email: "manager@esi.edu",
        passwordHash,
        role: "PROJECT_MANAGER",
      },
    }),
    prisma.user.create({
      data: {
        fullName: "Team Member",
        email: "member@esi.edu",
        passwordHash,
        role: "TEAM_MEMBER",
      },
    }),
  ]);

  const project = await prisma.project.create({
    data: {
      name: "ISO 9001 Certification - ESI",
      description: "University-wide quality management system implementation.",
      ownerId: manager.id,
      status: "IN_PROGRESS",
      startDate: new Date("2026-01-10"),
      endDate: new Date("2026-10-30"),
    },
  });

  const processA = await prisma.process.create({
    data: {
      name: "Academic Program Management",
      description: "Control and improve academic program lifecycle.",
      responsiblePerson: "Dr. Amina Benali",
      inputs: ["Curriculum requests", "Stakeholder feedback"],
      outputs: ["Updated program plans", "Improvement reports"],
      indicators: [
        { name: "Course review completion", target: 100, current: 72, unit: "%" },
        { name: "Program approval lead time", target: 30, current: 26, unit: "days" },
      ],
    },
  });

  const processB = await prisma.process.create({
    data: {
      name: "Internal Audit Management",
      description: "Schedule and execute internal quality audits.",
      responsiblePerson: "Mr. Karim Hadj",
      inputs: ["Audit plan", "Procedure checklists"],
      outputs: ["Audit findings", "Corrective action requests"],
      indicators: [
        { name: "Audit closure rate", target: 95, current: 81, unit: "%" },
      ],
    },
  });

  await prisma.projectProcess.createMany({
    data: [
      { projectId: project.id, processId: processA.id },
      { projectId: project.id, processId: processB.id },
    ],
  });

  const task1 = await prisma.task.create({
    data: {
      title: "Map existing procedures",
      description: "Identify gaps against ISO 9001 clauses.",
      status: "IN_PROGRESS",
      dueDate: new Date("2026-05-20"),
      startedAt: new Date("2026-03-05"),
      assigneeId: member.id,
      projectId: project.id,
      processId: processA.id,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: "Conduct internal pre-audit",
      description: "Run readiness audit before external body visit.",
      status: "TODO",
      dueDate: new Date("2026-04-01"),
      assigneeId: manager.id,
      projectId: project.id,
      processId: processB.id,
    },
  });

  await prisma.document.createMany({
    data: [
      {
        name: "procedure-gap-analysis.pdf",
        mimeType: "application/pdf",
        size: 153402,
        path: "uploads/procedure-gap-analysis.pdf",
        processId: processA.id,
        uploadedById: manager.id,
      },
      {
        name: "audit-checklist.xlsx",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        size: 91344,
        path: "uploads/audit-checklist.xlsx",
        taskId: task2.id,
        uploadedById: admin.id,
      },
    ],
  });

  console.log("Seed completed");
  console.log({
    credentials: [
      { email: "admin@esi.edu", password: "Password123!", role: "ADMIN" },
      { email: "manager@esi.edu", password: "Password123!", role: "PROJECT_MANAGER" },
      { email: "member@esi.edu", password: "Password123!", role: "TEAM_MEMBER" },
    ],
    taskIds: [task1.id, task2.id],
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
