const prisma = require("../config/prisma");
const { generateIsoCriteria } = require("../constants/iso-criteria-list");

async function listCriteria() {
  // Try DB first
  try {
    const rows = await prisma.criterion.findMany({ orderBy: { code: "asc" } });
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
