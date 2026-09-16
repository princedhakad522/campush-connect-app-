const REF = process.argv[2] ?? "jyfpwgeqztorpqlotljm";
const PUB = process.env.VITE_SUPABASE_ANON_KEY;
const BASE = `https://${REF}.supabase.co`;

async function main() {
  // 1. Sign in as student (matches app's supabase.auth.signInWithPassword)
  const login = await fetch(`${BASE}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: PUB, "Content-Type": "application/json" },
    body: JSON.stringify({ email: "student@campusconnect.demo", password: "Student@123" }),
  });
  const loginData = await login.json();
  if (!loginData.access_token) throw new Error("login failed: " + JSON.stringify(loginData).slice(0, 300));
  console.log("✓ login OK for student@campusconnect.demo");
  const token = loginData.access_token;

  // 2. Authenticated reads (as a signed-in user)
  const h = { apikey: PUB, Authorization: `Bearer ${token}` };
  const counts = {};
  for (const t of ["notices", "events", "timetable", "departments", "subjects", "lost_found", "discussions", "assignments", "notes", "profiles"]) {
    const r = await fetch(`${BASE}/rest/v1/${t}?select=*`, { headers: h });
    const rows = await r.json();
    counts[t] = Array.isArray(rows) ? rows.length : `ERR ${r.status} ${JSON.stringify(rows).slice(0,120)}`;
  }
  console.table(counts);

  // 3. RLS check: student trying to create a notice should FAIL (teachers/admins only)
  const createNotice = await fetch(`${BASE}/rest/v1/notices`, {
    method: "POST",
    headers: { ...h, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ title: "hax", content: "x", category: "General" }),
  });
  console.log("RLS create-notice-as-student ->", createNotice.status, "(expect 403)");

  // 4. Admin role can read all profiles
  const adminLogin = await fetch(`${BASE}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: PUB, "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@campusconnect.demo", password: "Admin@123" }),
  });
  const adminData = await adminLogin.json();
  const adminH = { apikey: PUB, Authorization: `Bearer ${adminData.access_token}` };
  const profiles = await fetch(`${BASE}/rest/v1/profiles?select=id,full_name,role&order=role`, { headers: adminH });
  console.log("✓ admin can list profiles:", JSON.stringify(await profiles.json()));
}

main().catch((e) => { console.error("FAIL:", e.message); process.exit(1); });