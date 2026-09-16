import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, UserCheck, UserX, Save, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getMyAttendance, getClassAttendance, markAttendance } from "../lib/api";
import {
  PageHeader,
  Button,
  Card,
  Field,
  Input,
  Select,
  Spinner,
  EmptyState,
  ErrorBox,
  Badge,
} from "../components/ui";
import { BranchSemesterFilter } from "../components/Filters";
import { BRANCHES, type AttendanceRecord } from "../lib/types";
import { cn, firstError, formatDate, isSetupError, initials } from "../lib/utils";

export default function Attendance() {
  const { profile, isStaff, isStudent } = useAuth();
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  // Student: own attendance
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  // Teacher: mark attendance
  const [branch, setBranch] = useState(isStaff ? "CSE" : (profile?.branch ?? "CSE"));
  const [semester, setSemester] = useState<number | null>(isStaff ? 1 : (profile?.semester ?? null));
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [roster, setRoster] = useState<{ student: any; status: "present" | "absent" | "unmarked" }[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const loadStudent = async () => {
    if (!profile) return;
    try {
      if (isStudent) setRecords(await getMyAttendance(profile.id));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const loadRoster = async () => {
    if (!subject || !date || semester == null) return;
    setLoading(true);
    setError(null);
    try {
      const r = await getClassAttendance({ branch, semester, subject, date });
      setRoster(r);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isStaff) {
      loadRoster();
    } else {
      loadStudent();
    }
  }, [isStaff, branch, semester, subject, date]);

  const bySubject = useMemo(() => {
    const map = new Map<string, { present: number; total: number }>();
    records.forEach((r) => {
      const cur = map.get(r.subject) ?? { present: 0, total: 0 };
      cur.total += 1;
      if (r.status === "present") cur.present += 1;
      map.set(r.subject, cur);
    });
    return Array.from(map.entries()).map(([subject, stats]) => ({
      subject,
      ...stats,
      pct: Math.round((stats.present / stats.total) * 100),
    }));
  }, [records]);

  const percent = useMemo(() => {
    if (records.length === 0) return null;
    return Math.round((records.filter((r) => r.status === "present").length / records.length) * 100);
  }, [records]);

  const setStatus = (studentId: string, status: "present" | "absent") => {
    setRoster((prev) => prev.map((r) => (r.student.id === studentId ? { ...r, status } : r)));
  };

  const markStatusForAll = (status: "present" | "absent") => {
    setRoster((prev) => prev.map((r) => ({ ...r, status })));
  };

  const save = async () => {
    const ids = roster.filter((r) => r.status !== "unmarked").map((r) => r.student.id);
    if (ids.length === 0) {
      setSaveMsg("No students selected.");
      return;
    }
    setSaving(true);
    setSaveMsg("");
    try {
      await markAttendance({ studentIds: ids, subject, date, status: "present" });
      await markAttendance({ studentIds: roster.filter((r) => r.status === "absent").map((r) => r.student.id), subject, date, status: "absent" });
      setSaveMsg("Attendance saved ✓");
    } catch (err) {
      setSaveMsg(firstError(err));
    } finally {
      setSaving(false);
    }
  };

  if (isStaff) {
    return (
      <div>
        <PageHeader
          title="Attendance"
          subtitle="Mark attendance for a class — branch, semester, subject and date."
        />

        <Card className="mb-5 p-4">
          <div className="flex flex-wrap gap-3">
            <BranchSemesterFilter branch={branch} setBranch={setBranch} semester={semester} setSemester={setSemester} />
            <div className="flex items-end gap-2">
              <Field label="Subject">
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject name" className="w-44" />
              </Field>
              <Field label="Date">
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
              </Field>
            </div>
          </div>
        </Card>

        {!!error && <ErrorBox error={error} setup={isSetupError(error)} onRetry={loadRoster} />}

        {loading ? (
          <Spinner className="mx-auto mt-16" />
        ) : roster.length === 0 && !error ? (
          <EmptyState
            icon={<ClipboardCheck className="h-10 w-10" />}
            title="No students found"
            subtitle="Enter a subject and date, then students matching this branch & semester appear here."
          />
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <Badge color="brand">
                {roster.length} students · {roster.filter((r) => r.status === "present").length} present ·{" "}
                {roster.filter((r) => r.status === "absent").length} absent
              </Badge>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => markStatusForAll("present")}>
                  <UserCheck className="h-3.5 w-3.5" /> Mark all present
                </Button>
                <Button size="sm" variant="outline" onClick={() => markStatusForAll("absent")}>
                  <UserX className="h-3.5 w-3.5" /> Mark all absent
                </Button>
                <Button size="sm" loading={saving} onClick={save}>
                  <Save className="h-3.5 w-3.5" /> Save attendance
                </Button>
              </div>
            </div>
            {saveMsg && <div className="mb-3 text-sm text-slate-600">{saveMsg}</div>}
            <Card className="overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-2.5 font-semibold">Student</th>
                    <th className="px-4 py-2.5 font-semibold">Roll No</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {roster.map((r) => (
                    <tr key={r.student.id}>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">
                            {initials(r.student.full_name)}
                          </div>
                          <span className="font-medium text-slate-800">{r.student.full_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500">{r.student.roll_number || "—"}</td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="inline-flex overflow-hidden rounded-lg border border-slate-200">
                          {(["present", "absent"] as const).map((s) => (
                            <button
                              key={s}
                              onClick={() => setStatus(r.student.id, s)}
                              className={cn(
                                "px-3 py-1 text-xs font-semibold capitalize transition",
                                r.status === s
                                  ? s === "present"
                                    ? "bg-green-500 text-white"
                                    : "bg-red-500 text-white"
                                  : "bg-white text-slate-400 hover:bg-slate-50"
                              )}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </>
        )}
      </div>
    );
  }

  // ---------------- Student view ----------------
  return (
    <div>
      <PageHeader
        title="My Attendance"
        subtitle={profile ? `${profile.branch ?? ""} · Semester ${profile.semester ?? ""}` : ""}
      />
      {!!error && <ErrorBox error={error} setup={isSetupError(error)} onRetry={loadStudent} />}
      {loading ? (
        <Spinner className="mx-auto mt-16" />
      ) : (
        <>
          {percent != null && (
            <Card className={cn("mb-5 p-5", percent >= 85 ? "border-green-200 bg-green-50/40" : percent >= 75 ? "border-amber-200 bg-amber-50/40" : "border-red-200 bg-red-50/40")}>
              <div className="flex items-center gap-4">
                <div className={cn("flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold", percent >= 85 ? "bg-green-100 text-green-700" : percent >= 75 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>
                  {percent}%
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Overall attendance</h3>
                  <p className="text-xs text-slate-500">
                    {records.filter((r) => r.status === "present").length} of {records.length} classes recorded.
                    {percent < 75 && " Keep it above 75%!"}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {bySubject.length === 0 ? (
            <EmptyState
              icon={<UserRound className="h-10 w-10" />}
              title="No attendance recorded yet"
              subtitle="Teachers will mark your attendance as classes happen."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {bySubject.map((s) => (
                <Card key={s.subject} className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-800">{s.subject}</h3>
                    <Badge color={s.pct >= 75 ? "green" : "red"}>{s.pct}%</Badge>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn("h-full rounded-full", s.pct >= 75 ? "bg-green-500" : "bg-red-500")}
                      style={{ width: `${s.pct}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    {s.present} present / {s.total} total
                  </div>
                </Card>
              ))}
            </div>
          )}

          {records.length > 0 && (
            <>
              <h3 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500">Recent records</h3>
              <Card className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-2.5 font-semibold">Date</th>
                      <th className="px-4 py-2.5 font-semibold">Subject</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {records.slice(0, 20).map((r) => (
                      <tr key={r.id}>
                        <td className="px-4 py-2.5 text-slate-600">{formatDate(r.date)}</td>
                        <td className="px-4 py-2.5 text-slate-600">{r.subject}</td>
                        <td className="px-4 py-2.5 text-right">
                          <Badge color={r.status === "present" ? "green" : "red"}>{r.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}