require("dotenv/config");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const passwordHash = "$2a$10$zFQ2kM5FQvVQHjYifbJvQeCZbZs3h/8pS1y5t9xk3i5wTtUu9nY7K"; // Password123!

  const userProfiles = [
    { fullName: "Nadia Ait Salem", email: "nadia.aitsalem@esi.edu", role: "PROJECT_MANAGER" },
    { fullName: "Yacine Merabet", email: "yacine.merabet@esi.edu", role: "TEAM_MEMBER" },
    { fullName: "Leila Boudiaf", email: "leila.boudiaf@esi.edu", role: "TEAM_MEMBER" },
    { fullName: "Sofiane Cherif", email: "sofiane.cherif@esi.edu", role: "PROJECT_MANAGER" },
    { fullName: "Meriem Saidi", email: "meriem.saidi@esi.edu", role: "TEAM_MEMBER" },
    { fullName: "Omar Bellal", email: "omar.bellal@esi.edu", role: "TEAM_MEMBER" },
    { fullName: "Amel Guerfi", email: "amel.guerfi@esi.edu", role: "PROJECT_MANAGER" },
  ];

  const users = await Promise.all(
    userProfiles.map((profile) => {
      return prisma.user.upsert({
        where: { email: profile.email },
        update: {},
        create: {
          fullName: profile.fullName,
          email: profile.email,
          passwordHash,
          role: profile.role,
        },
      });
    }),
  );

  const projectScenarios = [
    {
      name: "Teaching Laboratory Equipment Qualification",
      description: "Qualify laboratory devices used in practical courses before the certification audit.",
      status: "IN_PROGRESS",
      startDate: new Date("2026-02-05"),
      endDate: new Date("2026-08-15"),
    },
    {
      name: "Student Feedback Corrective Program",
      description: "Convert recurring student feedback into tracked corrective and preventive actions.",
      status: "PLANNED",
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-12-15"),
    },
    {
      name: "External Provider Review Cycle",
      description: "Review outsourced services and update qualification evidence for approved providers.",
      status: "DELAYED",
      startDate: new Date("2026-01-15"),
      endDate: new Date("2026-07-25"),
    },
    {
      name: "Training Effectiveness Follow-up",
      description: "Measure effectiveness of quality training sessions and close weak evaluation results.",
      status: "IN_PROGRESS",
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-09-10"),
    },
    {
      name: "Management Review Preparation",
      description: "Prepare objectives, indicators, risks, and action status for the annual management review.",
      status: "PLANNED",
      startDate: new Date("2026-09-01"),
      endDate: new Date("2026-11-30"),
    },
    {
      name: "Library Service Process Improvement",
      description: "Improve library request handling and monitor user satisfaction trends.",
      status: "IN_PROGRESS",
      startDate: new Date("2026-02-20"),
      endDate: new Date("2026-10-05"),
    },
    {
      name: "Nonconformity Backlog Stabilization",
      description: "Reduce open nonconformities through ownership cleanup and weekly closure reviews.",
      status: "DELAYED",
      startDate: new Date("2026-01-08"),
      endDate: new Date("2026-06-30"),
    },
  ];

  const projects = await Promise.all(
    projectScenarios.map((project, index) => {
      return prisma.project.create({
        data: {
          name: project.name,
          description: project.description,
          ownerId: users[index % users.length].id,
          status: project.status,
          startDate: project.startDate,
          endDate: project.endDate,
        },
      });
    }),
  );

  const processScenarios = [
    {
      name: "Laboratory Equipment Control",
      description: "Plan calibration, maintenance, and availability checks for teaching laboratory equipment.",
      responsiblePerson: "Dr. Farid Meziane",
      objectives: ["Keep critical devices fit for use", "Reduce unplanned equipment downtime"],
      inputs: ["Equipment inventory", "Calibration certificates"],
      outputs: ["Qualification reports", "Maintenance requests"],
      knowledgeItems: ["Calibration procedure", "Equipment risk matrix"],
      indicators: [
        { name: "Valid calibration coverage", target: 100, current: 84, unit: "%" },
        { name: "Maintenance closure lead time", target: 14, current: 18, unit: "days" },
      ],
    },
    {
      name: "Student Feedback Management",
      description: "Collect, analyze, and act on student feedback from courses and services.",
      responsiblePerson: "Mrs. Selma Ouari",
      objectives: ["Improve feedback response time", "Increase visible action closure"],
      inputs: ["Course surveys", "Service complaints"],
      outputs: ["Trend analysis", "Improvement actions"],
      knowledgeItems: ["Survey analysis guide", "Complaint escalation rules"],
      indicators: [
        { name: "Feedback response rate", target: 95, current: 78, unit: "%" },
        { name: "Average closure time", target: 20, current: 27, unit: "days" },
      ],
    },
    {
      name: "External Provider Control",
      description: "Qualify and monitor providers that affect academic and administrative service quality.",
      responsiblePerson: "Mr. Adel Mansouri",
      objectives: ["Keep provider files current", "Escalate repeated service failures"],
      inputs: ["Provider contracts", "Service evaluations"],
      outputs: ["Approved provider list", "Provider improvement requests"],
      knowledgeItems: ["Provider evaluation checklist", "Contract review template"],
      indicators: [
        { name: "Provider review completion", target: 100, current: 66, unit: "%" },
      ],
    },
    {
      name: "Competence and Training",
      description: "Plan competence development and verify training effectiveness for quality roles.",
      responsiblePerson: "Dr. Hana Bensaid",
      objectives: ["Close competence gaps", "Verify training effectiveness"],
      inputs: ["Competence matrix", "Training attendance sheets"],
      outputs: ["Training plans", "Effectiveness records"],
      knowledgeItems: ["Competence evaluation method", "Training feedback form"],
      indicators: [
        { name: "Training effectiveness verified", target: 90, current: 72, unit: "%" },
      ],
    },
    {
      name: "Management Review",
      description: "Compile QMS performance inputs and decisions for top management review.",
      responsiblePerson: "Prof. Mourad Belkacem",
      objectives: ["Prepare complete review inputs", "Track decisions to closure"],
      inputs: ["KPI dashboards", "Audit results", "Risk updates"],
      outputs: ["Review minutes", "Management decisions"],
      knowledgeItems: ["ISO 9001 clause 9.3", "Review input checklist"],
      indicators: [
        { name: "Review input readiness", target: 100, current: 58, unit: "%" },
      ],
    },
    {
      name: "Library User Service",
      description: "Manage user requests, reservations, and satisfaction for library services.",
      responsiblePerson: "Mrs. Rania Kaced",
      objectives: ["Shorten request handling time", "Improve user satisfaction"],
      inputs: ["Book requests", "Reservation queue"],
      outputs: ["Fulfilled requests", "Satisfaction report"],
      knowledgeItems: ["Request handling procedure", "Service catalog"],
      indicators: [
        { name: "On-time request handling", target: 95, current: 82, unit: "%" },
      ],
    },
    {
      name: "Nonconformity and CAPA Control",
      description: "Register nonconformities, assign ownership, and verify corrective action effectiveness.",
      responsiblePerson: "Mr. Kamel Djouadi",
      objectives: ["Reduce overdue nonconformities", "Verify action effectiveness"],
      inputs: ["Audit findings", "Incident reports"],
      outputs: ["Corrective action plans", "Effectiveness verification"],
      knowledgeItems: ["Root cause guide", "CAPA workflow"],
      indicators: [
        { name: "CAPA closure on time", target: 90, current: 61, unit: "%" },
        { name: "Effective actions at first check", target: 85, current: 69, unit: "%" },
      ],
    },
  ];

  const processes = await Promise.all(
    processScenarios.map((process) => {
      return prisma.process.create({
        data: {
          ...process,
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
      const taskScenarios = [
        ["Verify equipment calibration files", "Check certificates, labels, and expiry dates for all critical lab devices."],
        ["Analyze recurring student feedback", "Group feedback themes and propose actions for repeated course concerns."],
        ["Update provider evaluation records", "Collect missing evidence and score providers against the approved checklist."],
        ["Validate training effectiveness results", "Review quizzes and manager confirmations for completed quality trainings."],
        ["Compile management review KPI pack", "Prepare process performance inputs and unresolved action status."],
        ["Measure library request lead time", "Compare request timestamps against service target and identify late cases."],
        ["Clean up overdue CAPA ownership", "Assign owners and due dates for nonconformities without active follow-up."],
      ];
      return prisma.task.create({
        data: {
          title: taskScenarios[index][0],
          description: taskScenarios[index][1],
          status: index % 2 === 0 ? "TODO" : "IN_PROGRESS",
          dueDate: new Date(2026, 4, index + 6),
          plannedHours: 10 + index * 2,
          actualHours: index % 2 === 1 ? 5 + index : null,
          assigneeId: users[index % users.length].id,
          projectId: projects[index].id,
          processId: process.id,
        },
      });
    }),
  );

  const documentScenarios = [
    { name: "laboratory-calibration-register.pdf", mimeType: "application/pdf" },
    {
      name: "student-feedback-trend-analysis.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
    { name: "provider-evaluation-summary.pdf", mimeType: "application/pdf" },
    {
      name: "training-effectiveness-records.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
    { name: "management-review-input-pack.pdf", mimeType: "application/pdf" },
    { name: "library-service-log-export.csv", mimeType: "text/csv" },
    { name: "capa-backlog-review.pdf", mimeType: "application/pdf" },
  ];

  await prisma.document.createMany({
    data: tasks.map((task, index) => ({
      name: documentScenarios[index].name,
      mimeType: documentScenarios[index].mimeType,
      size: 120000 + index * 1000,
      path: `uploads/${documentScenarios[index].name}`,
      taskId: task.id,
      processId: processes[index].id,
      uploadedById: users[index % users.length].id,
    })),
  });

  await prisma.kpi.createMany({
    data: processes.map((process, index) => ({
      name: [
        "Calibration validity rate",
        "Feedback action closure rate",
        "Provider review completion",
        "Training effectiveness verification",
        "Management review input readiness",
        "Library request on-time handling",
        "CAPA on-time closure",
      ][index],
      description: [
        "Share of critical laboratory equipment with valid calibration evidence.",
        "Share of student feedback actions closed within the agreed target.",
        "Share of external providers reviewed during the current cycle.",
        "Share of completed trainings with verified effectiveness evidence.",
        "Readiness of required inputs before the management review meeting.",
        "Share of library requests handled within the service target.",
        "Share of corrective actions closed by their due date.",
      ][index],
      target: 100,
      current: 55 + index,
      unit: "%",
      processId: process.id,
    })),
  });

  const nonConformities = await Promise.all(
    processes.map((process, index) => {
      const cases = [
        ["Expired calibration label on oscilloscope", "A laboratory oscilloscope was available for use with an expired calibration label."],
        ["Student complaint response exceeded target", "Repeated feedback items stayed unanswered beyond the defined response time."],
        ["Missing provider performance evidence", "A key service provider file did not contain the latest evaluation record."],
        ["Training effectiveness not verified", "Attendance was recorded, but post-training effectiveness evidence was missing."],
        ["Management review risk input incomplete", "Risk and opportunity updates were not ready for management review preparation."],
        ["Library reservation status not updated", "Several completed reservations remained open in the service tracking file."],
        ["Corrective action root cause too generic", "A CAPA record used a generic root cause and lacked supporting analysis."],
      ];
      return prisma.nonConformity.create({
        data: {
          title: cases[index][0],
          description: cases[index][1],
          status: index % 2 === 0 ? "OPEN" : "ANALYSIS",
          severity: index % 3 === 2 ? "HIGH" : "MEDIUM",
          detectedAt: new Date(2026, 3, index + 3),
          processId: process.id,
          detectedById: users[index % users.length].id,
        },
      });
    }),
  );

  await prisma.correctiveAction.createMany({
    data: nonConformities.map((nc, index) => ({
      title: [
        "Recheck and relabel affected laboratory devices",
        "Introduce feedback triage and weekly closure review",
        "Complete provider evidence collection",
        "Add effectiveness checks to training closure",
        "Freeze management review input owners",
        "Automate library request status reconciliation",
        "Redo root cause analysis for weak CAPA records",
      ][index],
      description: [
        "Verify affected equipment, update calibration evidence, and relabel devices before reuse.",
        "Route repeated feedback themes to owners and review late actions every week.",
        "Collect missing provider evaluations and document supplier follow-up decisions.",
        "Require effectiveness evidence before training actions can be marked complete.",
        "Assign review input owners and confirm readiness before the meeting pack is issued.",
        "Compare completed reservations with open tracker items and close mismatches.",
        "Apply 5-why analysis and update action plans where root causes are incomplete.",
      ][index],
      recommendation: [
        "Prioritize equipment used in student assessments.",
        "Use feedback categories aligned to academic and service processes.",
        "Escalate providers with repeated missing or weak evidence.",
        "Keep evidence examples attached to each training record.",
        "Review readiness status in the weekly quality coordination meeting.",
        "Run reconciliation before monthly service reporting.",
        "Coach owners on evidence-based root cause statements.",
      ][index],
      actionType: index % 2 === 0 ? "CORRECTIVE" : "PREVENTIVE",
      status: index % 2 === 0 ? "IN_PROGRESS" : "OPEN",
      severity: index % 3 === 0 ? "HIGH" : "MEDIUM",
      source: "MANUAL",
      rootCause: [
        "Calibration status review was not included in weekly laboratory checks.",
        "Feedback ownership was unclear after initial categorization.",
        "Provider review evidence was stored outside the controlled QMS record.",
        "Training closure checklist did not require effectiveness confirmation.",
        "Input owners were assigned too late in the review preparation cycle.",
        "Manual reservation closure was skipped during peak service periods.",
        "Owners used template text without completing cause analysis.",
      ][index],
      containmentAction: [
        "Mark affected devices as unavailable until evidence is verified.",
        "Assign open feedback items to process owners for immediate response.",
        "Request missing provider files and flag incomplete records.",
        "Hold training records open until evidence is attached.",
        "List missing inputs and request confirmation from each owner.",
        "Close confirmed fulfilled reservations after log comparison.",
        "Return weak CAPA records to owners for analysis update.",
      ][index],
      effectivenessCriteria: [
        "All sampled critical equipment has valid calibration evidence.",
        "No repeated feedback item remains unanswered beyond the target.",
        "All active providers have current evaluation evidence.",
        "At least 90% of training records include effectiveness evidence.",
        "Management review inputs reach 100% readiness before issue.",
        "Reservation tracker matches fulfillment logs for two cycles.",
        "Reviewed CAPA records contain specific, evidence-backed root causes.",
      ][index],
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
            notes: `Assessment aligned with ${process.name.toLowerCase()} evidence.`,
          },
        }),
      ),
    );

    await prisma.criterionEvidence.createMany({
      data: processCriteria.map((pc, index) => ({
        processCriterionId: pc.id,
        type: "record",
        description: [
          "Calibration register and equipment sampling results.",
          "Student feedback dashboard and action tracker.",
          "Provider scorecard and review minutes.",
          "Training attendance and effectiveness verification records.",
          "Management review input checklist.",
          "Library service request export.",
          "CAPA backlog review and root cause updates.",
        ][index],
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
