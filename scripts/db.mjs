import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!PROJECT_REF || !TOKEN) {
  console.error("Set SUPABASE_PROJECT_REF and SUPABASE_ACCESS_TOKEN env vars.");
  process.exit(1);
}

const ENDPOINT = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

async function runSql(sql, label) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql, read_only: false }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${label} failed (${res.status}): ${text}`);
  }
  const data = await res.json().catch(() => null);
  console.log(`✓ ${label} (${sql.length} chars)`);
  if (Array.isArray(data) && data.length > 0) {
    console.log(JSON.stringify(data, null, 2).slice(0, 4000));
  }
  return data;
}

const root = resolve(import.meta.dirname, "..", "supabase");
const which = process.argv[2] ?? "all";

const FILES = {
  schema: "0001_schema.sql",
  seed: "0002_seed.sql",
  role_requests: "0003_role_requests.sql",
  branches_sections: "0004_branches_sections.sql",
  canteen_faculty: "0005_canteen_faculty.sql",
  all: null,
};

const target = FILES[which];

if (which === "all") {
  for (const f of [FILES.schema, FILES.seed, FILES.role_requests, FILES.branches_sections, FILES.canteen_faculty]) {
    const sql = await readFile(resolve(root, f), "utf8");
    await runSql(sql, f);
  }
} else {
  if (!target) {
    console.error(`Unknown target "${which}". Use: ${Object.keys(FILES).join(" | ")}`);
    process.exit(1);
  }
  const sql = await readFile(resolve(root, target), "utf8");
  await runSql(sql, target);
}
console.log("Done.");