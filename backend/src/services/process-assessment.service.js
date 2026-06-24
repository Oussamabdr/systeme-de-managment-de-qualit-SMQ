const prisma = require("../config/prisma");
const ApiError = require("../utils/apiError");
const { VERACITY_LEVELS } = require("../constants/iso-requirements");
const { generateIsoCriteria } = require("../constants/iso-criteria-list");
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

  // load all criteria from DB, with a static fallback when the catalog has been lost
  const allCriteria = await prisma.criterion.findMany({ orderBy: { code: "asc" } });
  const normalizedCriteria = allCriteria.length > 0 ? allCriteria : generateIsoCriteria();

  const requirements = normalizedCriteria.map((requirement) => {
    const saved = recordMap.get(requirement.code);
    return {
      id: requirement.id || null,
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

async function ensureCriteriaCatalog(codes) {
  const uniqueCodes = [...new Set(codes.filter(Boolean))];
  if (uniqueCodes.length === 0) return new Map();

  const existingCriteria = await prisma.criterion.findMany({
    where: { code: { in: uniqueCodes } },
    select: { id: true, code: true },
  });

  const codeToId = new Map(existingCriteria.map((criterion) => [criterion.code, criterion.id]));
  const catalog = new Map(generateIsoCriteria().map((criterion) => [criterion.code, criterion]));

  for (const code of uniqueCodes) {
    if (codeToId.has(code)) continue;

    const item = catalog.get(code);
    if (!item) {
      throw new ApiError(400, `Unknown ISO criterion code: ${code}`);
    }

    const created = await prisma.criterion.create({
      data: {
        code: item.code,
        title: item.title,
        description: item.description || "",
        clause: item.clause || null,
      },
      select: { id: true },
    });

    codeToId.set(code, created.id);
  }

  return codeToId;
}

async function saveProcessAssessment(processId, items) {
  await ensureProcessExists(processId);

  // Map provided codes to criterion IDs
  const codes = items.map((it) => it.code);
  const codeToId = await ensureCriteriaCatalog(codes);
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
