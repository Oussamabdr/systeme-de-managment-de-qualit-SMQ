const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function findOrCreateProject(data) {
  const existing = await prisma.project.findFirst({ where: { name: data.name } });
  if (existing) return existing;
  return prisma.project.create({ data });
}

async function findOrCreateProcess(data) {
  const existing = await prisma.process.findFirst({ where: { name: data.name } });
  if (existing) return existing;
  return prisma.process.create({ data });
}

async function findOrCreateTask(data) {
  const existing = await prisma.task.findFirst({
    where: {
      title: data.title,
      projectId: data.projectId,
      processId: data.processId,
    },
  });

  if (existing) {
    return prisma.task.update({
      where: { id: existing.id },
      data: {
        description: data.description,
        dueDate: data.dueDate,
        assigneeId: data.assigneeId,
        status: data.status,
      },
    });
  }

  return prisma.task.create({ data });
}

async function attachProcess(projectId, processId) {
  await prisma.projectProcess.upsert({
    where: {
      projectId_processId: {
        projectId,
        processId,
      },
    },
    create: { projectId, processId },
    update: {},
  });
}

async function main() {
  const admin = await prisma.user.findUnique({ where: { email: "admin@esi.edu" } });
  const manager = await prisma.user.findUnique({ where: { email: "manager@esi.edu" } });
  const member = await prisma.user.findUnique({ where: { email: "member@esi.edu" } });

  if (!admin || !manager || !member) {
    throw new Error("Users not found. Run backend seed first to create base users.");
  }

  const projects = {
    certification: await findOrCreateProject({
      name: "ISO 9001 Certification Wave 2",
      description: "Operational extension of QMS controls to all faculties.",
      ownerId: manager.id,
      status: "IN_PROGRESS",
      startDate: new Date("2026-02-01"),
      endDate: new Date("2026-12-10"),
    }),
    digitalDocs: await findOrCreateProject({
      name: "Document Digitalization Program",
      description: "Standardize and digitalize controlled quality documents.",
      ownerId: manager.id,
      status: "PLANNED",
      startDate: new Date("2026-04-10"),
      endDate: new Date("2026-11-30"),
    }),
    supplierQuality: await findOrCreateProject({
      name: "Supplier Quality Assurance",
      description: "Deploy supplier qualification and monitoring under ISO 9001.",
      ownerId: admin.id,
      status: "IN_PROGRESS",
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-10-15"),
    }),
  };

  const processes = {
    nonConformity: await findOrCreateProcess({
      name: "Non-Conformity Management",
      description: "Detect, log, and resolve non-conformities with traceability.",
      responsiblePerson: "Ms. Leila Saidi",
      inputs: ["Audit findings", "Incident reports", "User complaints"],
      outputs: ["NCR register", "Closure evidence", "Escalation records"],
      indicators: [
        { name: "NCR closure in SLA", target: 95, current: 84, unit: "%" },
        { name: "Reopened NCR rate", target: 5, current: 9, unit: "%" },
      ],
    }),
    correctiveAction: await findOrCreateProcess({
      name: "Corrective and Preventive Actions",
      description: "Plan CAPA actions and verify long-term effectiveness.",
      responsiblePerson: "Mr. Yacine Mekki",
      inputs: ["Root cause analysis", "Risk register"],
      outputs: ["CAPA plan", "Effectiveness review"],
      indicators: [
        { name: "CAPA completion rate", target: 92, current: 78, unit: "%" },
      ],
    }),
    documentControl: await findOrCreateProcess({
      name: "Document Control",
      description: "Control lifecycle of SOPs, forms, and quality manuals.",
      responsiblePerson: "Mrs. Sara Kamel",
      inputs: ["Draft SOP", "Approval workflow"],
      outputs: ["Approved procedures", "Version history"],
      indicators: [
        { name: "Document approval lead time", target: 10, current: 13, unit: "days" },
      ],
    }),
    supplierEvaluation: await findOrCreateProcess({
      name: "Supplier Evaluation",
      description: "Assess supplier capability and ongoing quality performance.",
      responsiblePerson: "Mr. Nabil Bouzid",
      inputs: ["Supplier dossier", "Performance metrics"],
      outputs: ["Approved supplier list", "Audit plans"],
      indicators: [
        { name: "Qualified suppliers ratio", target: 90, current: 86, unit: "%" },
      ],
    }),
    riskManagement: await findOrCreateProcess({
      name: "Risk and Opportunity Management",
      description: "Identify, assess, and monitor quality risks and opportunities.",
      responsiblePerson: "Dr. Imane Rahmani",
      inputs: ["Process maps", "Issue logs"],
      outputs: ["Risk treatment plans", "Opportunity backlog"],
      indicators: [
        { name: "Mitigated high risks", target: 100, current: 68, unit: "%" },
      ],
    }),
  };

  // Assign processes to projects.
  await attachProcess(projects.certification.id, processes.nonConformity.id);
  await attachProcess(projects.certification.id, processes.correctiveAction.id);
  await attachProcess(projects.certification.id, processes.riskManagement.id);

  await attachProcess(projects.digitalDocs.id, processes.documentControl.id);
  await attachProcess(projects.digitalDocs.id, processes.riskManagement.id);

  await attachProcess(projects.supplierQuality.id, processes.supplierEvaluation.id);
  await attachProcess(projects.supplierQuality.id, processes.correctiveAction.id);

  const tasks = [
    {
      title: "Build NCR classification matrix",
      description: "Define severity classes and escalation paths for all departments.",
      status: "IN_PROGRESS",
      dueDate: new Date("2026-05-25"),
      projectId: projects.certification.id,
      processId: processes.nonConformity.id,
      assigneeId: member.id,
      startedAt: new Date("2026-04-15"),
    },
    {
      title: "Launch CAPA follow-up board",
      description: "Set up weekly CAPA governance and ownership tracking.",
      status: "TODO",
      dueDate: new Date("2026-06-05"),
      projectId: projects.certification.id,
      processId: processes.correctiveAction.id,
      assigneeId: manager.id,
    },
    {
      title: "Risk register baseline workshop",
      description: "Run cross-functional workshop to baseline risk register.",
      status: "TODO",
      dueDate: new Date("2026-06-01"),
      projectId: projects.certification.id,
      processId: processes.riskManagement.id,
      assigneeId: admin.id,
    },
    {
      title: "Migrate SOP templates to controlled repository",
      description: "Upload and classify SOP templates with versioning tags.",
      status: "IN_PROGRESS",
      dueDate: new Date("2026-05-18"),
      projectId: projects.digitalDocs.id,
      processId: processes.documentControl.id,
      assigneeId: member.id,
      startedAt: new Date("2026-04-20"),
    },
    {
      title: "Define digital approval workflow",
      description: "Map approval lanes and SLA alerts for document lifecycle.",
      status: "TODO",
      dueDate: new Date("2026-06-15"),
      projectId: projects.digitalDocs.id,
      processId: processes.documentControl.id,
      assigneeId: manager.id,
    },
    {
      title: "Audit top 10 suppliers",
      description: "Perform qualification audit and scorecard review.",
      status: "IN_PROGRESS",
      dueDate: new Date("2026-05-30"),
      projectId: projects.supplierQuality.id,
      processId: processes.supplierEvaluation.id,
      assigneeId: manager.id,
      startedAt: new Date("2026-04-22"),
    },
    {
      title: "Close supplier corrective actions backlog",
      description: "Resolve overdue supplier CAPA actions and collect evidence.",
      status: "TODO",
      dueDate: new Date("2026-06-10"),
      projectId: projects.supplierQuality.id,
      processId: processes.correctiveAction.id,
      assigneeId: member.id,
    },
  ];

  const createdTasks = [];
  for (const taskData of tasks) {
    const task = await findOrCreateTask(taskData);
    createdTasks.push(task);
  }

  console.log("Domain data upsert completed.");
  console.log({
    projects: Object.values(projects).map((p) => ({ id: p.id, name: p.name })),
    processes: Object.values(processes).map((p) => ({ id: p.id, name: p.name })),
    tasks: createdTasks.map((t) => ({ id: t.id, title: t.title, projectId: t.projectId, processId: t.processId, assigneeId: t.assigneeId })),
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
