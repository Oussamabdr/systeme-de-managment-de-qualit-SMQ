const crypto = require("node:crypto");
const { ISO_CRITERIA } = require("../src/constants/iso-criteria-list");

function getSupabaseConfig() {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error("Missing Supabase configuration: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required");
  }

  return { baseUrl, apiKey };
}

function chunk(items, size) {
  const batches = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

async function upsertBatch(baseUrl, apiKey, rows) {
  const response = await fetch(`${baseUrl}/rest/v1/Criterion?on_conflict=code`, {
    method: "POST",
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(rows),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase restore failed (${response.status}): ${text}`);
  }

  return response.json();
}

async function main() {
  const { baseUrl, apiKey } = getSupabaseConfig();
  const now = new Date().toISOString();
  const rows = ISO_CRITERIA.map((item) => ({
    id: crypto.randomUUID().replace(/-/g, ""),
    code: item.code,
    title: item.title,
    description: item.description || "",
    clause: item.clause || null,
    createdAt: now,
    updatedAt: now,
  }));

  let restored = 0;
  for (const batch of chunk(rows, 20)) {
    const result = await upsertBatch(baseUrl, apiKey, batch);
    restored += Array.isArray(result) ? result.length : batch.length;
  }

  console.log(JSON.stringify({ total: rows.length, restored }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
