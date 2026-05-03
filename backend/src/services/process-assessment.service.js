const prisma = require("../config/prisma");
const ApiError = require("../utils/apiError");
const { ISO_REQUIREMENTS, VERACITY_LEVELS } = require("../constants/iso-requirements");

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

function buildAssessmentResponse(records) {
  const recordMap = new Map(records.map((record) => [record.requirementCode, record]));
  const requirements = ISO_REQUIREMENTS.map((requirement) => {
    const saved = recordMap.get(requirement.code);
    return {
      code: requirement.code,
      name: requirement.name,
      score: saved ? saved.score : 0,
      veracityLevel: saved?.veracityLevel || "FALSE",
      notes: saved?.notes || "",
      updatedAt: saved?.updatedAt || null,
    };
  });

  const totalScore = requirements.reduce((sum, item) => sum + item.score, 0);
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
  const records = await prisma.processRequirementAssessment.findMany({
    where: { processId },
    orderBy: { requirementCode: "asc" },
  });

  return buildAssessmentResponse(records);
}

async function saveProcessAssessment(processId, items) {
  await ensureProcessExists(processId);

  const allowedCodes = new Set(ISO_REQUIREMENTS.map((item) => item.code));
  const invalidItem = items.find((item) => !allowedCodes.has(item.code));
  if (invalidItem) {
    throw new ApiError(400, `Unknown ISO requirement code: ${invalidItem.code}`);
  }

  await prisma.$transaction(
    items.map((item) =>
      prisma.processRequirementAssessment.upsert({
        where: {
          processId_requirementCode: {
            processId,
            requirementCode: item.code,
          },
        },
        update: {
          requirementName: item.name,
          score: clampScore(item.score),
          veracityLevel: normalizeVeracityLevel(item.veracityLevel),
          notes: item.notes || "",
        },
        create: {
          processId,
          requirementCode: item.code,
          requirementName: item.name,
          score: clampScore(item.score),
          veracityLevel: normalizeVeracityLevel(item.veracityLevel),
          notes: item.notes || "",
        },
      }),
    ),
  );

  return getProcessAssessment(processId);
}

module.exports = {
  getProcessAssessment,
  saveProcessAssessment,
};
