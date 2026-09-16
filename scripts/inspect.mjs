const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

const q = `select schemaname, tablename from pg_tables
  where schemaname not in ('pg_catalog','information_schema')
  order by 1,2;`;

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: q, read_only: true }),
});
console.log(res.status);
console.log(JSON.stringify(await res.json(), null, 2).slice(0, 8000));