const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { ISO_CRITERIA } = require("../src/constants/iso-criteria-list");

const prisma = new PrismaClient();

async function main() {
  await prisma.correctiveAction.deleteMany();
  await prisma.nonConformity.deleteMany();
  await prisma.document.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectProcess.deleteMany();
  await prisma.process.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Password123!", 10);

  const [admin, manager, member, caq] = await Promise.all([
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
    prisma.user.create({
      data: {
        fullName: "Quality Assurance Coordinator",
        email: "caq@esi.edu",
        passwordHash,
        role: "CAQ",
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

  const projectDelayed = await prisma.project.create({
    data: {
      name: "Supplier Quality Recovery Program",
      description: "Recover supplier conformity through escalation, CAPA, and follow-up audits.",
      ownerId: manager.id,
      status: "DELAYED",
      startDate: new Date("2026-01-20"),
      endDate: new Date("2026-07-30"),
    },
  });

  const projectCompleted = await prisma.project.create({
    data: {
      name: "Document Control Digitalization",
      description: "Digitize and standardize controlled quality documents and templates.",
      ownerId: admin.id,
      status: "COMPLETED",
      startDate: new Date("2025-09-01"),
      endDate: new Date("2026-02-20"),
    },
  });

  const projectPlanned = await prisma.project.create({
    data: {
      name: "Risk and Opportunity Program 2027",
      description: "Prepare proactive risk and opportunity governance cycle for next year.",
      ownerId: manager.id,
      status: "PLANNED",
      startDate: new Date("2026-11-01"),
      endDate: new Date("2027-06-30"),
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

  const processC = await prisma.process.create({
    data: {
      name: "Supplier Evaluation",
      description: "Evaluate supplier performance and qualification against quality criteria.",
      responsiblePerson: "Mrs. Samira Khelifi",
      objectives: ["Reduce supplier defects", "Increase audit coverage"],
      inputs: ["Supplier scorecards", "Incoming inspection reports"],
      outputs: ["Approved supplier list", "Supplier CAPA requests"],
      knowledgeItems: ["Supplier audit checklist", "Escalation matrix"],
      indicators: [
        { name: "Supplier defect rate", target: 2, current: 4.5, unit: "%" },
        { name: "On-time supplier audits", target: 95, current: 70, unit: "%" },
      ],
    },
  });

  const processD = await prisma.process.create({
    data: {
      name: "Document Control",
      description: "Manage versioning, approval, and controlled distribution of quality documents.",
      responsiblePerson: "Mr. Riad Tarek",
      objectives: ["Ensure current approved docs", "Reduce approval delays"],
      inputs: ["Draft procedures", "Change requests"],
      outputs: ["Approved documents", "Version history"],
      knowledgeItems: ["Document coding convention", "Approval workflow"],
      indicators: [
        { name: "Approval lead time", target: 10, current: 8, unit: "days" },
      ],
    },
  });

  const processE = await prisma.process.create({
    data: {
      name: "Risk and Opportunity Management",
      description: "Identify and monitor quality risks and improvement opportunities.",
      responsiblePerson: "Dr. Imane Rahmani",
      objectives: ["Treat high risks on time", "Track opportunity realization"],
      inputs: ["Risk workshops", "Process performance trends"],
      outputs: ["Risk register", "Treatment plans"],
      knowledgeItems: ["ISO 9001 clause 6", "Risk scoring guide"],
      indicators: [
        { name: "Mitigated high risks", target: 100, current: 60, unit: "%" },
      ],
    },
  });

  await prisma.projectProcess.createMany({
    data: [
      { projectId: project.id, processId: processA.id },
      { projectId: project.id, processId: processB.id },
      { projectId: projectDelayed.id, processId: processC.id },
      { projectId: projectDelayed.id, processId: processB.id },
      { projectId: projectCompleted.id, processId: processD.id },
      { projectId: projectPlanned.id, processId: processE.id },
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

  const task3 = await prisma.task.create({
    data: {
      title: "Close overdue supplier CAPA backlog",
      description: "Resolve pending supplier corrective actions older than 45 days.",
      status: "TODO",
      dueDate: new Date("2026-03-15"),
      plannedHours: 24,
      actualHours: 6,
      assigneeId: member.id,
      projectId: projectDelayed.id,
      processId: processC.id,
    },
  });

  const task4 = await prisma.task.create({
    data: {
      title: "Run supplier emergency audit",
      description: "Perform focused audit on top non-performing suppliers.",
      status: "IN_PROGRESS",
      dueDate: new Date("2026-05-05"),
      plannedHours: 16,
      actualHours: 22,
      startedAt: new Date("2026-04-18"),
      assigneeId: manager.id,
      projectId: projectDelayed.id,
      processId: processB.id,
    },
  });

  const task5 = await prisma.task.create({
    data: {
      title: "Publish controlled SOP repository",
      description: "Finalize migration of approved SOPs with version tags.",
      status: "DONE",
      dueDate: new Date("2026-02-15"),
      plannedHours: 30,
      actualHours: 27,
      startedAt: new Date("2026-01-20"),
      completedAt: new Date("2026-02-12"),
      assigneeId: member.id,
      projectId: projectCompleted.id,
      processId: processD.id,
    },
  });

  const task6 = await prisma.task.create({
    data: {
      title: "Prepare 2027 risk workshop plan",
      description: "Define workshop calendar and participant matrix.",
      status: "TODO",
      dueDate: new Date("2026-12-10"),
      plannedHours: 12,
      assigneeId: manager.id,
      projectId: projectPlanned.id,
      processId: processE.id,
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

  // Seed ISO criteria - idempotent upsert
  console.log("Seeding ISO criteria...");
  for (const item of ISO_CRITERIA) {
    await prisma.criterion.upsert({
      where: { code: item.code },
      update: {
        title: item.title,
        description: item.description || "",
        clause: item.clause || null,
      },
      create: {
        code: item.code,
        title: item.title,
        description: item.description || "",
        clause: item.clause || null,
      },
    });
  }
  const nonConformityA = await prisma.nonConformity.create({
    data: {
      title: "Missing calibration evidence for measurement device",
      description: "No valid calibration certificate available during internal audit sample check.",
      status: "ANALYSIS",
      severity: "HIGH",
      detectedAt: new Date("2026-04-12"),
      processId: processB.id,
      detectedById: manager.id,
    },
  });

  const nonConformityB = await prisma.nonConformity.create({
    data: {
      title: "Delayed closure of previous audit findings",
      description: "Two audit actions exceeded closure SLA in the previous quarter.",
      status: "OPEN",
      severity: "MEDIUM",
      detectedAt: new Date("2026-04-08"),
      processId: processB.id,
      detectedById: admin.id,
    },
  });

  await prisma.correctiveAction.createMany({
    data: [
      {
        title: "Recalibrate affected devices and update registry",
        description: "Schedule urgent calibration and update controlled asset list.",
        recommendation: "Prioritize lab equipment used in final assessments.",
        actionType: "CORRECTIVE",
        status: "IN_PROGRESS",
        severity: "HIGH",
        source: "MANUAL",
        rootCause: "Lack of reminder control for certificate expiry",
        containmentAction: "Block use of non-calibrated devices until recalibrated",
        effectivenessCriteria: "100% calibration validity for critical devices",
        effectivenessStatus: "PENDING",
        nonConformityId: nonConformityA.id,
        projectId: project.id,
        processId: processB.id,
        taskId: task2.id,
        ownerId: manager.id,
        createdById: admin.id,
        dueDate: new Date("2026-05-25"),
      },
      {
        title: "Introduce monthly NC closure review meeting",
        description: "Set governance cadence to avoid overdue closure of findings.",
        recommendation: "Review overdue actions with process owners and escalation rules.",
        actionType: "PREVENTIVE",
        status: "DONE",
        severity: "MEDIUM",
        source: "KPI_DEVIATION",
        rootCause: "No formal closure review rhythm",
        containmentAction: "Immediate backlog review for overdue findings",
        effectivenessCriteria: "No overdue NC older than 30 days",
        effectivenessStatus: "VERIFIED",
        verificationComment: "Reviewed over two cycles with no recurring delay pattern.",
        verifiedAt: new Date("2026-04-28"),
        nonConformityId: nonConformityB.id,
        projectId: project.id,
        processId: processB.id,
        ownerId: member.id,
        createdById: manager.id,
        verifiedById: caq.id,
        dueDate: new Date("2026-04-22"),
      },
    ],
  });

  console.log("Seed completed");
  console.log({
    credentials: [
      { email: "admin@esi.edu", password: "Password123!", role: "ADMIN" },
      { email: "manager@esi.edu", password: "Password123!", role: "PROJECT_MANAGER" },
      { email: "member@esi.edu", password: "Password123!", role: "TEAM_MEMBER" },
      { email: "caq@esi.edu", password: "Password123!", role: "CAQ" },
    ],
    demoProjects: [
      { name: project.name, status: "IN_PROGRESS" },
      { name: projectDelayed.name, status: "DELAYED" },
      { name: projectCompleted.name, status: "COMPLETED" },
      { name: projectPlanned.name, status: "PLANNED" },
    ],
    demoProcesses: [processA.name, processB.name, processC.name, processD.name, processE.name],
    taskIds: [task1.id, task2.id, task3.id, task4.id, task5.id, task6.id],
    demoTaskCases: [
      "IN_PROGRESS baseline execution",
      "TODO overdue delayed task",
      "IN_PROGRESS with actualHours > plannedHours",
      "DONE with completedAt and effort tracking",
      "PLANNED project future task",
    ],
    demoNonConformities: [nonConformityA.title, nonConformityB.title],
    demoCorrectiveActions: [
      "Recalibrate affected devices and update registry",
      "Introduce monthly NC closure review meeting",
    ],
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
