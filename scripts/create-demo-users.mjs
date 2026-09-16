import { randomBytes } from "node:crypto";

const REF = process.env.SUPABASE_PROJECT_REF ?? "jyfpwgeqztorpqlotljm";
const SECRET = process.env.SUPABASE_SECRET_KEY;

if (!SECRET) {
  console.error("Set SUPABASE_SECRET_KEY (server-side only, do not use in the browser).");
  process.exit(1);
}

const BASE = `https://${REF}.supabase.co`;

const users = [
  { email: "student@campusconnect.demo", password: "Student@123", full: "Aarav Sharma", role: "student", branch: "CSE", semester: 1, roll: "24CSE0101" },
  { email: "teacher@campusconnect.demo", password: "Teacher@123", full: "Dr. Meera Nair", role: "teacher", faculty: "FAC-2024-01" },
  { email: "admin@campusconnect.demo", password: "Admin@123", full: "Principal Admin", role: "admin" },
];

async function call(path, options = {}) {
  const res = await fetch(BASE + path, {
    ...options,
    headers: {
      apikey: SECRET,
      Authorization: `Bearer ${SECRET}`,
      "Content-Type": "application/json",
      "User-Agent": "campus-setup/1.0",
      ...(options.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${path} -> ${res.status}: ${text}`);
  return text ? JSON.parse(text) : {};
}

for (const u of users) {
  try {
    const created = await call("/auth/v1/admin/users", {
      method: "POST",
      body: JSON.stringify({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.full, role: u.role },
      }),
    });
    console.log(`✓ auth user ${u.email}`);
    await call(`/rest/v1/profiles`, {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({
        id: created.id,
        email: u.email,
        full_name: u.full,
        role: u.role,
        branch: u.branch ?? null,
        semester: u.semester ?? null,
        roll_number: u.roll ?? null,
        faculty_id: u.faculty ?? null,
      }),
    });
    console.log(`✓ profile ${u.email}`);
  } catch (e) {
    console.error(`✗ ${u.email}: ${e.message}`);
  }
}
console.log("Demo accounts ready (see README for passwords).");
void randomBytes;