const prisma = require("../config/prisma");
const ApiError = require("../utils/apiError");
const { VERACITY_LEVELS } = require("../constants/iso-requirements");
const { clearDashboardCache } = require("./dashboard.service");

function clampScore(score) {
  const numericScore = Number(score);
  if (Number.isNaN(numericScore)) return 0;
  return Math.max(0, Math.min(100, numericScore));
}

const allowedVeracityLevels = new Set(VERACITY_LEVELS.map((item) => item.value));

function normalizeVeracityLevel(level) {
  if (allowedVeracityLevels.has(level)) {
    return level;
  }
  return "FALSE";
}

async function buildAssessmentResponse(records) {
  // records: ProcessCriterion rows keyed by criterion code
  const recordMap = new Map(records.map((record) => [record.criterion.code, record]));

  // load all criteria from DB
  const allCriteria = await prisma.criterion.findMany({ orderBy: { code: "asc" } });

  const requirements = allCriteria.map((requirement) => {
    const saved = recordMap.get(requirement.code);
    return {
      id: requirement.id,
      code: requirement.code,
      name: requirement.title,
      description: requirement.description || "",
      clause: requirement.clause || null,
      selected: !!saved ? !!saved.selected : false,
      score: saved ? saved.score : 0,
      rate: saved ? saved.rate : null,
      veracityLevel: saved?.veracityLevel || "FALSE",
      notes: saved?.notes || "",
      updatedAt: saved?.updatedAt || null,
    };
  });

  const totalScore = requirements.reduce((sum, item) => sum + (Number(item.score) || 0), 0);
  const overallScore = requirements.length > 0 ? Math.round((totalScore / requirements.length) * 10) / 10 : 0;

  return {
    requirements,
    summary: {
      overallScore,
      requirementCount: requirements.length,
      completedCount: requirements.filter((item) => item.score > 0).length,
      veracityDistribution: VERACITY_LEVELS.map((level) => ({
        value: level.value,
        label: level.label,
        count: requirements.filter((item) => item.veracityLevel === level.value).length,
      })),
    },
  };
}

async function ensureProcessExists(processId) {
  const process = await prisma.process.findUnique({
    where: { id: processId },
    select: { id: true, name: true },
  });

  if (!process) {
    throw new ApiError(404, "Process not found");
  }

  return process;
}

async function getProcessAssessment(processId) {
  await ensureProcessExists(processId);
  const records = await prisma.processCriterion.findMany({
    where: { processId },
    include: { criterion: true },
  });

  return buildAssessmentResponse(records);
}

async function saveProcessAssessment(processId, items) {
  await ensureProcessExists(processId);

  // Map provided codes to criterion IDs
  const codes = items.map((it) => it.code);
  const criteria = await prisma.criterion.findMany({ where: { code: { in: codes } } });
  const codeToId = new Map(criteria.map((c) => [c.code, c.id]));
  const invalidItem = items.find((item) => !codeToId.has(item.code));
  if (invalidItem) {
    throw new ApiError(400, `Unknown ISO criterion code: ${invalidItem.code}`);
  }

  const ops = items.map((item) => {
    const criterionId = codeToId.get(item.code);
    return prisma.processCriterion.upsert({
      where: {
        processId_criterionId: {
          processId,
          criterionId,
        },
      },
      update: {
        selected: item.selected !== undefined ? !!item.selected : true,
        score: clampScore(item.score),
        rate: item.rate ?? null,
        veracityLevel: normalizeVeracityLevel(item.veracityLevel),
        notes: item.notes || "",
      },
      create: {
        processId,
        criterionId,
        selected: item.selected !== undefined ? !!item.selected : true,
        score: clampScore(item.score),
        rate: item.rate ?? null,
        veracityLevel: normalizeVeracityLevel(item.veracityLevel),
        notes: item.notes || "",
      },
    });
  });

  await prisma.$transaction(ops);

  clearDashboardCache();

  return getProcessAssessment(processId);
}

module.exports = {
  getProcessAssessment,
  saveProcessAssessment,
};
