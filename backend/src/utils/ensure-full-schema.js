const fs = require("fs");
const path = require("path");

const sqlFilePath = path.resolve(__dirname, "../../prisma/full-schema.sql");
let ensurePromise;

function isIgnorablePostgresError(error) {
  const code = String(error?.meta?.code || error?.code || "");
  const message = String(error?.message || "");
  if (["42P07", "42710", "42P06", "42701"].includes(code)) {
    return true;
  }

  return /already exists|duplicate/i.test(message);
}

function normalizeSql(sql) {
  return sql
    .replace(/^\uFEFF/, "")
    .split(/;\s*\n/g)
    .map((chunk) => chunk
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n")
      .trim())
    .filter(Boolean);
}

async function ensureFullSchema(prisma) {
  if (process.env.AUTO_MIGRATE_SCHEMA === "false") {
    return;
  }

  if (!ensurePromise) {
    ensurePromise = (async () => {
      if (!fs.existsSync(sqlFilePath)) {
        console.warn("full-schema.sql not found; skipping auto schema migration.");
        return;
      }

      const sql = fs.readFileSync(sqlFilePath, "utf8");
      const statements = normalizeSql(sql);

      for (const statement of statements) {
        try {
          await prisma.$executeRawUnsafe(statement);
        } catch (error) {
          if (!isIgnorablePostgresError(error)) {
            throw error;
          }
        }
      }

      console.info(`Auto schema migration checked ${statements.length} SQL statements.`);
    })().catch((error) => {
      ensurePromise = undefined;
      throw error;
    });
  }

  return ensurePromise;
}

module.exports = { ensureFullSchema };
