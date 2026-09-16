import { supabase } from "./supabase";
import type {
  AppNotification,
  Assignment,
  AttendanceRecord,
  CampusEvent,
  Department,
  Discussion,
  DiscussionReply,
  LostFoundItem,
  Note,
  Notice,
  Profile,
  RoleRequest,
  Submission,
  Subject,
  TimetableEntry,
} from "./types";

type Fn<T> = () => Promise<T>;

async function run<T>(fn: Fn<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Request failed");
  }
}

// ---------------- Auth / Profiles ----------------

export interface SignUpInput {
  email: string;
  password: string;
  fullName: string;
  role: Profile["role"];
  branch?: string;
  semester?: number | null;
  rollNumber?: string;
  facultyId?: string;
}

export async function signUpUser(input: SignUpInput) {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.fullName,
        role: input.role,
        branch: input.branch ?? null,
        semester: input.semester ?? null,
        roll_number: input.rollNumber ?? null,
        faculty_id: input.facultyId ?? null,
      },
    },
  });
  if (error) throw new Error(error.message);
  const userId = data.user?.id;
  // If email confirmation is on, there's no session yet and profiles RLS
  // ("id = auth.uid()") would reject an unauthenticated insert. The profile
  // is then auto-created on first sign-in (see AuthContext).
  if (userId && data.session) {
    await createProfile({
      id: userId,
      email: input.email,
      full_name: input.fullName,
      role: input.role,
      branch: input.branch ?? null,
      semester: input.semester ?? null,
      roll_number: input.rollNumber ?? null,
      faculty_id: input.facultyId ?? null,
    });
  }
  return data;
}

export async function loginUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw new Error(error.message);
}

export async function getProfile(userId: string): Promise<Profile | null> {
  return run(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    return data as Profile | null;
  });
}

export async function createProfile(profile: {
  id: string;
  email: string;
  full_name: string;
  role: Profile["role"];
  branch?: string | null;
  semester?: number | null;
  roll_number?: string | null;
  faculty_id?: string | null;
}) {
  const { error } = await supabase.from("profiles").upsert(profile);
  if (error) throw new Error(error.message);
}

export async function ensureProfile(user: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}): Promise<Profile | null> {
  const existing = await getProfile(user.id);
  if (existing) return existing;
  const md = user.user_metadata ?? {};
  const role = (md.role === "teacher" || md.role === "admin" ? md.role : "student") as Profile["role"];
  await createProfile({
    id: user.id,
    email: user.email ?? "",
    full_name: typeof md.full_name === "string" ? md.full_name : (user.email ?? "Student"),
    role,
    branch: typeof md.branch === "string" ? md.branch : null,
    semester: typeof md.semester === "number" ? md.semester : null,
    roll_number: typeof md.roll_number === "string" ? md.roll_number : null,
    faculty_id: typeof md.faculty_id === "string" ? md.faculty_id : null,
  });
  return getProfile(user.id);
}

export async function updateProfile(
  id: string,
  updates: Partial<Pick<Profile, "full_name" | "branch" | "semester" | "roll_number" | "faculty_id" | "avatar_url">>
) {
  const { error } = await supabase.from("profiles").update(updates).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listUsers(params?: { q?: string; role?: string }): Promise<Profile[]> {
  return run(async () => {
    let q = supabase.from("profiles").select("*");
    if (params?.role && params.role !== "all") q = q.eq("role", params.role);
    if (params?.q) q = q.or(`full_name.ilike.%${params.q}%,email.ilike.%${params.q}%`);
    const { data, error } = await q.order("created_at", { ascending: false }).limit(200);
    if (error) throw error;
    return (data ?? []) as Profile[];
  });
}

export async function adminUpdateUser(id: string, updates: Partial<Omit<Profile, "id" | "email" | "created_at">>) {
  const { error } = await supabase.from("profiles").update(updates).eq("id", id);
  if (error) throw new Error(error.message);
}

// ---------------- Departments ----------------

export async function listDepartments(): Promise<Department[]> {
  return run(async () => {
    const { data, error } = await supabase.from("departments").select("*").order("name");
    if (error) throw error;
    return (data ?? []) as Department[];
  });
}

export async function addDepartment(input: { name: string; code: string; description?: string }) {
  const { error } = await supabase.from("departments").insert(input);
  if (error) throw new Error(error.message);
}

// ---------------- Subjects ----------------

export async function listSubjects(params?: { branch?: string; semester?: number }): Promise<Subject[]> {
  return run(async () => {
    let q = supabase.from("subjects").select("*").order("semester").order("name");
    if (params?.branch) q = q.eq("branch", params.branch);
    if (params?.semester) q = q.eq("semester", params.semester);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as Subject[];
  });
}

export async function addSubject(input: { name: string; code: string; branch: string; semester: number }) {
  const { error } = await supabase.from("subjects").insert(input);
  if (error) throw new Error(error.message);
}

// ---------------- Notes ----------------

export interface NoteFilters {
  branch?: string;
  semester?: number | null;
  subject?: string;
  q?: string;
}

export async function listNotes(filters: NoteFilters = {}): Promise<Note[]> {
  return run(async () => {
    let q = supabase
      .from("notes")
      .select("*, uploader:profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (filters.branch) q = q.eq("branch", filters.branch);
    if (filters.semester) q = q.eq("semester", filters.semester);
    if (filters.subject) q = q.eq("subject", filters.subject);
    if (filters.q) q = q.or(`title.ilike.%${filters.q}%,subject.ilike.%${filters.q}%`);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as Note[];
  });
}

export async function uploadNote(input: {
  title: string;
  description: string;
  subject: string;
  branch: string;
  semester: number;
  file: File;
}) {
  return run(async () => {
    const user = (await supabase.auth.getUser()).data.user;
    const path = `${user?.id ?? "anon"}/${Date.now()}-${input.file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: uploadError } = await supabase.storage
      .from("notes")
      .upload(path, input.file, { upsert: false });
    if (uploadError) throw uploadError;
    const { data: pub } = supabase.storage.from("notes").getPublicUrl(path);
    const { error } = await supabase.from("notes").insert({
      title: input.title,
      description: input.description,
      subject: input.subject,
      branch: input.branch,
      semester: input.semester,
      file_url: pub.publicUrl,
      file_name: input.file.name,
      file_type: (input.file.name.split(".").pop() ?? "").toUpperCase(),
      uploader_id: user?.id ?? null,
    });
    if (error) throw error;
  });
}

export async function deleteNote(id: string) {
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ---------------- Notices ----------------

export async function listNotices(): Promise<Notice[]> {
  return run(async () => {
    const { data, error } = await supabase
      .from("notices")
      .select("*, author:profiles(full_name)")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return (data ?? []) as Notice[];
  });
}

export async function createNotice(input: { title: string; content: string; category: string; pinned?: boolean }) {
  return run(async () => {
    const user = (await supabase.auth.getUser()).data.user;
    const { data, error } = await supabase
      .from("notices")
      .insert({ ...input, pinned: input.pinned ?? false, created_by: user?.id ?? null })
      .select()
      .single();
    if (error) throw error;
    await notifyAllStudents({
      title: "New notice published",
      body: input.title,
      type: "notice",
      link: "/notices",
    });
    return data as Notice;
  });
}

export async function deleteNotice(id: string) {
  const { error } = await supabase.from("notices").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ---------------- Events ----------------

export async function listEvents(): Promise<CampusEvent[]> {
  return run(async () => {
    const user = (await supabase.auth.getUser()).data.user;
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("event_date")
      .limit(100);
    if (error) throw error;

    const events = (data ?? []) as CampusEvent[];
    if (!user) return events;

    const { data: regs } = await supabase
      .from("event_registrations")
      .select("event_id")
      .eq("user_id", user.id);
    const registeredIds = new Set((regs ?? []).map((r) => r.event_id));

    const { count: totalRegs } = await supabase
      .from("event_registrations")
      .select("*", { count: "exact", head: true });
    void totalRegs;

    return events.map((e) => ({
      ...e,
      registered: registeredIds.has(e.id),
    }));
  });
}

export async function createEvent(input: {
  title: string;
  description: string;
  event_date: string;
  location: string;
  category: string;
  image_url?: string;
}) {
  return run(async () => {
    const user = (await supabase.auth.getUser()).data.user;
    const { error } = await supabase
      .from("events")
      .insert({ ...input, created_by: user?.id ?? null });
    if (error) throw error;
    await notifyAllStudents({
      title: `New event: ${input.title}`,
      body: input.location,
      type: "event",
      link: "/events",
    });
  });
}

export async function toggleRegistration(eventId: string) {
  return run(async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    const { data: existing } = await supabase
      .from("event_registrations")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (existing) {
      const { error } = await supabase
        .from("event_registrations")
        .delete()
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("event_registrations")
        .insert({ event_id: eventId, user_id: user.id });
      if (error) throw error;
    }
  });
}

// ---------------- Timetable ----------------

export async function getTimetable(branch: string, semester: number): Promise<TimetableEntry[]> {
  return run(async () => {
    const { data, error } = await supabase
      .from("timetable")
      .select("*")
      .eq("branch", branch)
      .eq("semester", semester)
      .order("day_of_week")
      .order("start_time");
    if (error) throw error;
    return (data ?? []) as TimetableEntry[];
  });
}

export async function upsertTimetableEntry(input: Omit<TimetableEntry, "id" | "created_at">) {
  const { error } = await supabase.from("timetable").insert(input);
  if (error) throw new Error(error.message);
}

export async function deleteTimetableEntry(id: string) {
  const { error } = await supabase.from("timetable").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ---------------- Attendance ----------------

export async function getMyAttendance(studentId: string): Promise<AttendanceRecord[]> {
  return run(async () => {
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("student_id", studentId)
      .order("date", { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data ?? []) as AttendanceRecord[];
  });
}

export async function getClassAttendance(params: { branch: string; semester: number; subject: string; date: string }) {
  return run(async () => {
    const { data: students, error: sErr } = await supabase
      .from("profiles")
      .select("id, full_name, roll_number, branch, semester")
      .eq("role", "student")
      .eq("branch", params.branch)
      .eq("semester", params.semester)
      .order("roll_number");
    if (sErr) throw sErr;
    const { data: records, error: rErr } = await supabase
      .from("attendance")
      .select("*")
      .eq("subject", params.subject)
      .eq("date", params.date);
    if (rErr) throw rErr;
    const map = new Map((records ?? []).map((r: any) => [r.student_id as string, r.status as string]));
    return (students ?? []).map((s) => ({
      student: s,
      status: (map.get(s.id as string) ?? "unmarked") as "present" | "absent" | "unmarked",
    }));
  });
}

export async function markAttendance(input: {
  studentIds: string[];
  subject: string;
  date: string;
  status: "present" | "absent";
}) {
  return run(async () => {
    const user = (await supabase.auth.getUser()).data.user;
    const rows = input.studentIds.map((sid) => ({
      student_id: sid,
      subject: input.subject,
      date: input.date,
      status: input.status,
      marked_by: user?.id ?? null,
    }));
    const { error } = await supabase.from("attendance").upsert(rows, { onConflict: "student_id,subject,date" });
    if (error) throw error;
  });
}

// ---------------- Assignments ----------------

export async function listAssignments(): Promise<Assignment[]> {
  return run(async () => {
    const user = (await supabase.auth.getUser()).data.user;
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    const assignments = (data ?? []) as Assignment[];

    if (!user) return assignments;

    const { data: subs, error: sErr } = await supabase
      .from("submissions")
      .select("assignment_id")
      .eq("student_id", user.id);
    if (sErr) throw sErr;
    const submittedIds = new Set((subs ?? []).map((s) => s.assignment_id));

    const { data: counts } = await supabase.from("submissions").select("assignment_id");
    const countMap = new Map<string, number>();
    (counts ?? []).forEach((c) => {
      countMap.set(c.assignment_id, (countMap.get(c.assignment_id) ?? 0) + 1);
    });

    return assignments.map((a) => ({
      ...a,
      submitted: submittedIds.has(a.id),
      submissions_count: countMap.get(a.id) ?? 0,
    }));
  });
}

export async function createAssignment(input: {
  title: string;
  description: string;
  subject: string;
  branch: string;
  semester: number;
  due_date: string | null;
  file?: File | null;
}) {
  return run(async () => {
    const user = (await supabase.auth.getUser()).data.user;
    let fileUrl = "";
    let fileName = "";
    if (input.file) {
      const path = `${user?.id ?? "anon"}/${Date.now()}-${input.file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: uErr } = await supabase.storage.from("assignments").upload(path, input.file);
      if (uErr) throw uErr;
      const { data: pub } = supabase.storage.from("assignments").getPublicUrl(path);
      fileUrl = pub.publicUrl;
      fileName = input.file.name;
    }
    const { error } = await supabase.from("assignments").insert({
      title: input.title,
      description: input.description,
      subject: input.subject,
      branch: input.branch,
      semester: input.semester,
      due_date: input.due_date,
      file_url: fileUrl,
      file_name: fileName,
      created_by: user?.id ?? null,
    });
    if (error) throw error;
    await notifyAllStudents({
      title: `New assignment: ${input.title}`,
      body: `Due: ${input.due_date ? new Date(input.due_date).toLocaleDateString() : "To be announced"}`,
      type: "assignment",
      link: "/assignments",
    });
  });
}

export async function submitAssignment(assignmentId: string, file: File) {
  return run(async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error("Not signed in");
    const path = `${user.id}/${assignmentId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: uErr } = await supabase.storage.from("submissions").upload(path, file, { upsert: true });
    if (uErr) throw uErr;
    const { error } = await supabase.from("submissions").upsert(
      {
        assignment_id: assignmentId,
        student_id: user.id,
        file_url: path,
        file_name: file.name,
      },
      { onConflict: "assignment_id,student_id" }
    );
    if (error) throw error;
  });
}

export async function listSubmissions(assignmentId: string): Promise<Submission[]> {
  return run(async () => {
    const { data, error } = await supabase
      .from("submissions")
      .select("*, student:profiles(id, full_name, roll_number, branch, semester)")
      .eq("assignment_id", assignmentId);
    if (error) throw error;
    const subs = (data ?? []) as Submission[];
    const withUrls = await Promise.all(
      subs.map(async (s) => {
        if (s.file_url && !s.file_url.startsWith("http")) {
          const { data: signed } = await supabase.storage
            .from("submissions")
            .createSignedUrl(s.file_url, 3600);
          return { ...s, file_url: signed?.signedUrl ?? s.file_url };
        }
        return s;
      })
    );
    return withUrls;
  });
}

// ---------------- Lost & Found ----------------

export async function listLostFound(): Promise<LostFoundItem[]> {
  return run(async () => {
    const { data, error } = await supabase
      .from("lost_found")
      .select("*, reporter:profiles(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return (data ?? []) as LostFoundItem[];
  });
}

export async function createLostFound(input: {
  title: string;
  description: string;
  kind: "lost" | "found";
  item: string;
  location: string;
  image?: File | null;
}) {
  return run(async () => {
    const user = (await supabase.auth.getUser()).data.user;
    let imageUrl = "";
    if (input.image) {
      const path = `${user?.id ?? "anon"}/${Date.now()}-${input.image.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: uErr } = await supabase.storage.from("lost_found").upload(path, input.image);
      if (uErr) throw uErr;
      const { data: pub } = supabase.storage.from("lost_found").getPublicUrl(path);
      imageUrl = pub.publicUrl;
    }
    const { error } = await supabase.from("lost_found").insert({
      title: input.title,
      description: input.description,
      kind: input.kind,
      item: input.item,
      location: input.location,
      image_url: imageUrl,
      user_id: user?.id ?? null,
    });
    if (error) throw error;
  });
}

export async function resolveLostFound(id: string, resolved: boolean) {
  const { error } = await supabase
    .from("lost_found")
    .update({ status: resolved ? "resolved" : "open" })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// ---------------- Community ----------------

export async function listDiscussions(): Promise<Discussion[]> {
  return run(async () => {
    const { data, error } = await supabase
      .from("discussions")
      .select("*, author:profiles(full_name, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    const discussions = (data ?? []) as Discussion[];
    const withCounts = await Promise.all(
      discussions.map(async (d) => {
        const { count } = await supabase
          .from("discussion_replies")
          .select("*", { count: "exact", head: true })
          .eq("discussion_id", d.id);
        return { ...d, replies: count ?? 0 };
      })
    );
    return withCounts;
  });
}

export async function createDiscussion(input: { title: string; content: string }) {
  return run(async () => {
    const user = (await supabase.auth.getUser()).data.user;
    const { error } = await supabase.from("discussions").insert({
      ...input,
      user_id: user?.id ?? null,
    });
    if (error) throw error;
  });
}

export async function deleteDiscussion(id: string) {
  const { error } = await supabase.from("discussions").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listReplies(discussionId: string): Promise<DiscussionReply[]> {
  return run(async () => {
    const { data, error } = await supabase
      .from("discussion_replies")
      .select("*, author:profiles(full_name, avatar_url)")
      .eq("discussion_id", discussionId)
      .order("created_at");
    if (error) throw error;
    return (data ?? []) as DiscussionReply[];
  });
}

export async function createReply(discussionId: string, content: string) {
  return run(async () => {
    const user = (await supabase.auth.getUser()).data.user;
    const { error } = await supabase.from("discussion_replies").insert({
      discussion_id: discussionId,
      user_id: user?.id ?? null,
      content,
    });
    if (error) throw error;
  });
}

// ---------------- Notifications ----------------

export async function listMyNotifications(): Promise<AppNotification[]> {
  return run(async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return [];
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return (data ?? []) as AppNotification[];
  });
}

export async function markNotificationRead(id: string, read = true) {
  const { error } = await supabase.from("notifications").update({ read }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function markAllNotificationsRead() {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return;
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);
  if (error) throw new Error(error.message);
}

export async function clearNotifications() {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return;
  const { error } = await supabase.from("notifications").delete().eq("user_id", user.id).eq("read", true);
  if (error) throw new Error(error.message);
}

export async function notifyAllStudents(input: { title: string; body: string; type: string; link: string }) {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    const { data: students } = await supabase.from("profiles").select("id").eq("role", "student").limit(1000);
    if (!students || students.length === 0) return;
    const rows = students.map((s) => ({
      user_id: s.id,
      title: input.title,
      body: input.body,
      type: input.type,
      link: input.link,
      created_by: user?.id ?? null,
    }));
    await supabase.from("notifications").insert(rows);
  } catch {
    // notifications are best-effort
  }
}

// ---------------- Role Requests ----------------

export async function createRoleRequest(input: { requestedRole: "teacher" | "admin"; reason: string }) {
  return run(async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error("Not signed in");
    const { error } = await supabase.from("role_requests").insert({
      user_id: user.id,
      requested_role: input.requestedRole,
      reason: input.reason,
    });
    if (error) throw new Error(error.message);
  });
}

export async function listRoleRequests(status?: string): Promise<RoleRequest[]> {
  return run(async () => {
    let q = supabase
      .from("role_requests")
      .select("*, user:profiles(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (status && status !== "all") q = q.eq("status", status);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as RoleRequest[];
  });
}

export async function getMyRoleRequest(): Promise<RoleRequest | null> {
  return run(async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return null;
    const { data } = await supabase
      .from("role_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data ?? null) as RoleRequest | null;
  });
}

export async function reviewRoleRequest(requestId: string, approve: boolean) {
  return run(async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error("Not signed in");
    const { data: req, error: rErr } = await supabase
      .from("role_requests")
      .select("*")
      .eq("id", requestId)
      .maybeSingle();
    if (rErr || !req) throw new Error("Request not found");
    const { error: uErr } = await supabase
      .from("role_requests")
      .update({
        status: approve ? "approved" : "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq("id", requestId);
    if (uErr) throw new Error(uErr.message);
    if (approve) {
      const { error: promoteErr } = await supabase
        .from("profiles")
        .update({ role: req.requested_role })
        .eq("id", req.user_id);
      if (promoteErr) throw new Error(promoteErr.message);
    }
  });
}

export async function deleteRoleRequest(requestId: string) {
  const { error } = await supabase.from("role_requests").delete().eq("id", requestId);
  if (error) throw new Error(error.message);
}

// ---------------- Dashboard stats ----------------

export async function getHomeStats() {
  return run(async () => {
    const user = (await supabase.auth.getUser()).data.user;
    const [notes, notices, events, assignments, lostFound, discussions, notifs] = await Promise.all([
      supabase.from("notes").select("*", { count: "exact", head: true }),
      supabase.from("notices").select("*", { count: "exact", head: true }),
      supabase.from("events").select("*", { count: "exact", head: true }).gte("event_date", new Date().toISOString()),
      supabase.from("assignments").select("*", { count: "exact", head: true }),
      supabase.from("lost_found").select("*", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("discussions").select("*", { count: "exact", head: true }),
      user
        ? supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false)
        : Promise.resolve({ count: 0, error: null }),
    ]);

    const count = (r: { count: number | null }) => r.count ?? 0;

    return {
      notes: count(notes),
      notices: count(notices),
      events: count(events),
      assignments: count(assignments),
      openLostFound: count(lostFound),
      discussions: count(discussions),
      unreadNotifications: count(notifs),
    };
  });
}