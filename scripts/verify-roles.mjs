// node scripts/verify-roles.mjs   (env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
// Full role-request flow: request -> 42s cooldown -> admin approve + promote -> staff create right. Cleans up after.
const BASE = process.env.VITE_SUPABASE_URL;
const ANON = process.env.VITE_SUPABASE_ANON_KEY;
const UA = "supabase-node-verifier (campus-connect)";
const authHeader = (token) => ({ "Content-Type": "application/json", "User-Agent": UA, apikey: ANON, Authorization: `Bearer ${token}` });
const auto = async (token, method, p, body) => {
  const r = await fetch(`${BASE}/${p}`, { method, body: body ? JSON.stringify(body) : undefined, headers: authHeader(token) });
  return { status: r.status, body: await r.text() };
};
const login = async (email, password) => {
  const r = await auto(ANON, "POST", "auth/v1/token?grant_type=password", { email, password });
  const j = JSON.parse(r.body);
  if (!j.access_token) throw new Error(r.body);
  return j;
};

let uid;
let admin;
let student;
try {
  student = await login("student@campusconnect.demo", "Student@123");
  admin = await login("admin@campusconnect.demo", "Admin@123");
  uid = student.user.id;
  console.log("✓ student + admin logged in");

  // ensure clean start (student role + no pending rows)
  await auto(admin.access_token, "PATCH", `rest/v1/profiles?id=eq.${uid}`, { role: "student" });
  await auto(admin.access_token, "DELETE", `rest/v1/role_requests?user_id=eq.${uid}`);

  // 1. request a role as student (student account, only own insert allowed)
  const first = await auto(student.access_token, "POST", "rest/v1/role_requests", { user_id: uid, requested_role: "teacher", reason: "I am faculty" });
  if (first.status >= 400) throw new Error(`first request rejected: ${first.status} ${first.body}`);
  console.log("✓ student created a role request");

  // 2. immediate second request must hit the 42s cooldown trigger
  const dup = await auto(student.access_token, "POST", "rest/v1/role_requests", { user_id: uid, requested_role: "admin", reason: "dup" });
  if (dup.status >= 400 && dup.body.includes("42 seconds")) {
    console.log("✓ cooldown enforced: " + dup.body.replace(/\s+/g, " ").slice(0, 110));
  } else {
    throw new Error(dup.status >= 400 ? `unexpected error: ${dup.body}` : "duplicate accepted, cooldown missing");
  }

  // 3. admin sees it and reviews
  const reqs = await auto(admin.access_token, "GET", `rest/v1/role_requests?user_id=eq.${uid}&select=id,requested_role,status,reason&order=created_at.desc&limit=1`);
  const req = JSON.parse(reqs.body)[0];
  if (!req || req.status !== "pending") throw new Error("admin can't see pending request: " + reqs.body.slice(0, 200));
  console.log("✓ admin sees pending request (" + req.requested_role + ")");

  const approve = await auto(admin.access_token, "PATCH", `rest/v1/role_requests?id=eq.${req.id}`, { status: "approved", reviewed_at: new Date().toISOString(), reviewed_by: admin.user.id });
  if (approve.status >= 400) throw new Error("approve failed: " + approve.body);
  const promote = await auto(admin.access_token, "PATCH", `rest/v1/profiles?id=eq.${uid}`, { role: "teacher" });
  if (promote.status >= 400) throw new Error("promote failed: " + promote.body);
  console.log("✓ request approved + profile promoted to teacher");

  // 4. as teacher, posting a notice now works (staff-only policy)
  const notice = await auto(student.access_token, "POST", "rest/v1/notices", { title: "__post_promotion_smoke_test__", content: "auto", category: "general", created_by: uid });
  if (notice.status >= 400) throw new Error("teacher create-notice failed: " + notice.body);
  console.log("✓ promoted user can now post notices (staff policy active)");

  console.log("All role-request checks passed.");
} finally {
  // cleanup: revert demo user, remove test rows
  try {
    await auto(admin.access_token, "DELETE", `rest/v1/notices?created_by=eq.${uid}&title=eq.__post_promotion_smoke_test__`);
    await auto(admin.access_token, "PATCH", `rest/v1/profiles?id=eq.${uid}`, { role: "student" });
    await auto(admin.access_token, "DELETE", `rest/v1/role_requests?user_id=eq.${uid}`);
    console.log("✓ cleanup done (demo user reverted, test rows removed)");
  } catch (e) {
    console.log("cleanup warning:", String(e).slice(0, 200));
  }
}