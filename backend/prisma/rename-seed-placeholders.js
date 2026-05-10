require("dotenv/config");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const users = [
  { oldEmail: "seed.user1@esi.edu", fullName: "Nadia Ait Salem", email: "nadia.aitsalem@esi.edu", role: "PROJECT_MANAGER" },
  { oldEmail: "seed.user2@esi.edu", fullName: "Yacine Merabet", email: "yacine.merabet@esi.edu", role: "TEAM_MEMBER" },
  { oldEmail: "seed.user3@esi.edu", fullName: "Leila Boudiaf", email: "leila.boudiaf@esi.edu", role: "TEAM_MEMBER" },
  { oldEmail: "seed.user4@esi.edu", fullName: "Sofiane Cherif", email: "sofiane.cherif@esi.edu", role: "PROJECT_MANAGER" },
  { oldEmail: "seed.user5@esi.edu", fullName: "Meriem Saidi", email: "meriem.saidi@esi.edu", role: "TEAM_MEMBER" },
  { oldEmail: "seed.user6@esi.edu", fullName: "Omar Bellal", email: "omar.bellal@esi.edu", role: "TEAM_MEMBER" },
  { oldEmail: "seed.user7@esi.edu", fullName: "Amel Guerfi", email: "amel.guerfi@esi.edu", role: "PROJECT_MANAGER" },
];

const projects = [
  ["Teaching Laboratory Equipment Qualification", "Qualify laboratory devices used in practical courses before the certification audit.", "IN_PROGRESS"],
  ["Student Feedback Corrective Program", "Convert recurring student feedback into tracked corrective and preventive actions.", "PLANNED"],
  ["External Provider Review Cycle", "Review outsourced services and update qualification evidence for approved providers.", "DELAYED"],
  ["Training Effectiveness Follow-up", "Measure effectiveness of quality training sessions and close weak evaluation results.", "IN_PROGRESS"],
  ["Management Review Preparation", "Prepare objectives, indicators, risks, and action status for the annual management review.", "PLANNED"],
  ["Library Service Process Improvement", "Improve library request handling and monitor user satisfaction trends.", "IN_PROGRESS"],
  ["Nonconformity Backlog Stabilization", "Reduce open nonconformities through ownership cleanup and weekly closure reviews.", "DELAYED"],
];

const processes = [
  ["Laboratory Equipment Control", "Plan calibration, maintenance, and availability checks for teaching laboratory equipment.", "Dr. Farid Meziane", [{ name: "Valid calibration coverage", target: 100, current: 84, unit: "%" }, { name: "Maintenance closure lead time", target: 14, current: 18, unit: "days" }]],
  ["Student Feedback Management", "Collect, analyze, and act on student feedback from courses and services.", "Mrs. Selma Ouari", [{ name: "Feedback response rate", target: 95, current: 78, unit: "%" }, { name: "Average closure time", target: 20, current: 27, unit: "days" }]],
  ["External Provider Control", "Qualify and monitor providers that affect academic and administrative service quality.", "Mr. Adel Mansouri", [{ name: "Provider review completion", target: 100, current: 66, unit: "%" }]],
  ["Competence and Training", "Plan competence development and verify training effectiveness for quality roles.", "Dr. Hana Bensaid", [{ name: "Training effectiveness verified", target: 90, current: 72, unit: "%" }]],
  ["Management Review", "Compile QMS performance inputs and decisions for top management review.", "Prof. Mourad Belkacem", [{ name: "Review input readiness", target: 100, current: 58, unit: "%" }]],
  ["Library User Service", "Manage user requests, reservations, and satisfaction for library services.", "Mrs. Rania Kaced", [{ name: "On-time request handling", target: 95, current: 82, unit: "%" }]],
  ["Nonconformity and CAPA Control", "Register nonconformities, assign ownership, and verify corrective action effectiveness.", "Mr. Kamel Djouadi", [{ name: "CAPA closure on time", target: 90, current: 61, unit: "%" }, { name: "Effective actions at first check", target: 85, current: 69, unit: "%" }]],
];

const tasks = [
  ["Verify equipment calibration files", "Check certificates, labels, and expiry dates for all critical lab devices."],
  ["Analyze recurring student feedback", "Group feedback themes and propose actions for repeated course concerns."],
  ["Update provider evaluation records", "Collect missing evidence and score providers against the approved checklist."],
  ["Validate training effectiveness results", "Review quizzes and manager confirmations for completed quality trainings."],
  ["Compile management review KPI pack", "Prepare process performance inputs and unresolved action status."],
  ["Measure library request lead time", "Compare request timestamps against service target and identify late cases."],
  ["Clean up overdue CAPA ownership", "Assign owners and due dates for nonconformities without active follow-up."],
];

const documents = [
  ["laboratory-calibration-register.pdf", "application/pdf"],
  ["student-feedback-trend-analysis.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  ["provider-evaluation-summary.pdf", "application/pdf"],
  ["training-effectiveness-records.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  ["management-review-input-pack.pdf", "application/pdf"],
  ["library-service-log-export.csv", "text/csv"],
  ["capa-backlog-review.pdf", "application/pdf"],
];

const kpis = [
  ["Calibration validity rate", "Share of critical laboratory equipment with valid calibration evidence."],
  ["Feedback action closure rate", "Share of student feedback actions closed within the agreed target."],
  ["Provider review completion", "Share of external providers reviewed during the current cycle."],
  ["Training effectiveness verification", "Share of completed trainings with verified effectiveness evidence."],
  ["Management review input readiness", "Readiness of required inputs before the management review meeting."],
  ["Library request on-time handling", "Share of library requests handled within the service target."],
  ["CAPA on-time closure", "Share of corrective actions closed by their due date."],
];

const nonConformities = [
  ["Expired calibration label on oscilloscope", "A laboratory oscilloscope was available for use with an expired calibration label."],
  ["Student complaint response exceeded target", "Repeated feedback items stayed unanswered beyond the defined response time."],
  ["Missing provider performance evidence", "A key service provider file did not contain the latest evaluation record."],
  ["Training effectiveness not verified", "Attendance was recorded, but post-training effectiveness evidence was missing."],
  ["Management review risk input incomplete", "Risk and opportunity updates were not ready for management review preparation."],
  ["Library reservation status not updated", "Several completed reservations remained open in the service tracking file."],
  ["Corrective action root cause too generic", "A CAPA record used a generic root cause and lacked supporting analysis."],
];

const correctiveActions = [
  "Recheck and relabel affected laboratory devices",
  "Introduce feedback triage and weekly closure review",
  "Complete provider evidence collection",
  "Add effectiveness checks to training closure",
  "Freeze management review input owners",
  "Automate library request status reconciliation",
  "Redo root cause analysis for weak CAPA records",
];

async function updateByName(model, oldName, data) {
  return model.updateMany({ where: { name: oldName }, data });
}

async function updateByTitle(model, oldTitle, data) {
  return model.updateMany({ where: { title: oldTitle }, data });
}

async function main() {
  for (const [index, user] of users.entries()) {
    await prisma.user.updateMany({
      where: { email: user.oldEmail },
      data: { fullName: user.fullName, email: user.email, role: user.role },
    });

    await updateByName(prisma.project, `Seed Project ${index + 1}`, {
      name: projects[index][0],
      description: projects[index][1],
      status: projects[index][2],
    });

    await updateByName(prisma.process, `Seed Process ${index + 1}`, {
      name: processes[index][0],
      description: processes[index][1],
      responsiblePerson: processes[index][2],
      indicators: processes[index][3],
    });

    await updateByTitle(prisma.task, `Seed Task ${index + 1}`, {
      title: tasks[index][0],
      description: tasks[index][1],
    });

    await updateByName(prisma.document, `seed-doc-${index + 1}.pdf`, {
      name: documents[index][0],
      mimeType: documents[index][1],
      path: `uploads/${documents[index][0]}`,
    });

    await updateByName(prisma.kpi, `Seed KPI ${index + 1}`, {
      name: kpis[index][0],
      description: kpis[index][1],
    });

    await updateByTitle(prisma.nonConformity, `Seed Nonconformity ${index + 1}`, {
      title: nonConformities[index][0],
      description: nonConformities[index][1],
    });

    await updateByTitle(prisma.correctiveAction, `Seed Corrective Action ${index + 1}`, {
      title: correctiveActions[index],
    });
  }

  console.log("Renamed seed placeholder records.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
