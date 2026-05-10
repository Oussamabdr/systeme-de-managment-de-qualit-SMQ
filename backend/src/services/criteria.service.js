const prisma = require("../config/prisma");
const { generateIsoCriteria } = require("../constants/iso-criteria-list");

const DB_TIMEOUT_MS = 6000;

async function withDbTimeout(promise) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Database request timeout")), DB_TIMEOUT_MS);
    }),
  ]);
}

async function listCriteria() {
  // Try DB first
  try {
    const rows = await withDbTimeout(prisma.criterion.findMany({ orderBy: { code: "asc" } }));
    if (Array.isArray(rows) && rows.length > 0)
      return rows.map((r) => ({
        code: r.code,
        title: r.title,
        description: r.description || "",
        clause: r.clause || null,
      }));
  } catch (err) {
    // If prisma proxy throws because DB not configured, fall through to static list
  }

  // Fallback to generated static list
  return generateIsoCriteria();
}

module.exports = { listCriteria };
