import { useEffect, useState } from "react";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getTimetable, upsertTimetableEntry, deleteTimetableEntry } from "../lib/api";
import { DAY_LABELS, type TimetableEntry } from "../lib/types";
import {
  PageHeader,
  Button,
  Card,
  Field,
  Input,
  Select,
  Modal,
  Spinner,
  EmptyState,
  ErrorBox,
} from "../components/ui";
import { BranchSemesterFilter } from "../components/Filters";
import { BRANCHES, SEMESTERS } from "../lib/types";
import { cn, firstError, isSetupError } from "../lib/utils";
import { CalendarClock } from "lucide-react";

export default function Timetable() {
  const { profile, isStaff } = useAuth();
  const [branch, setBranch] = useState(profile?.branch ?? "CSE");
  const [semester, setSemester] = useState<number | null>(profile?.semester ?? null);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [open, setOpen] = useState(false);
  const [day, setDay] = useState(0);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [subject, setSubject] = useState("");
  const [room, setRoom] = useState("");
  const [entryBranch, setEntryBranch] = useState(branch);
  const [entrySemester, setEntrySemester] = useState(semester ?? 1);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const load = async () => {
    if (!branch || semester == null) return;
    setLoading(true);
    try {
      setEntries(await getTimetable(branch, semester));
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [branch, semester]);

  const byDay = DAY_LABELS.map((_, i) => entries.filter((e) => e.day_of_week === i));

  const submit = async () => {
    if (!subject.trim()) {
      setFormError("Subject is required.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      await upsertTimetableEntry({
        branch: entryBranch,
        semester: entrySemester,
        day_of_week: day,
        start_time: startTime,
        end_time: endTime,
        subject,
        room,
        teacher_id: null,
      });
      setOpen(false);
      setSubject("");
      setRoom("");
      await load();
    } catch (err) {
      setFormError(firstError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Timetable"
        subtitle={semester != null ? `${branch} · Semester ${semester}` : "Select branch & semester to see classes."}
        actions={
          isStaff && (
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Add class
            </Button>
          )
        }
      />

      <div className="mb-5">
        <BranchSemesterFilter branch={branch} setBranch={setBranch} semester={semester} setSemester={setSemester} />
      </div>

      {!!error && <ErrorBox error={error} setup={isSetupError(error)} onRetry={load} />}

      {loading ? (
        <Spinner className="mx-auto mt-16" />
      ) : entries.length === 0 && !error ? (
        <EmptyState
          icon={<CalendarDays className="h-10 w-10" />}
          title="No classes yet"
          subtitle={isStaff ? "Add the first class for this branch & semester." : "The timetable for this branch will be added soon."}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {DAY_LABELS.map((label, i) => {
            const dayEntries = byDay[i];
            if (dayEntries.length === 0 && entries.length) return null;
            return (
              <Card key={label} className="overflow-hidden">
                <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                  <CalendarClock className="h-4 w-4 text-brand-600" />
                  <h3 className="text-sm font-semibold text-slate-800">{label}</h3>
                  <span className="ml-auto text-xs text-slate-400">{dayEntries.length} class{dayEntries.length !== 1 && "es"}</span>
                </div>
                <div className={cn("divide-y divide-slate-50", dayEntries.length === 0 && "p-4")}>
                  {dayEntries.length === 0 ? (
                    <div className="text-center text-xs text-slate-400">No classes / Free day</div>
                  ) : (
                    dayEntries.map((e) => (
                      <div key={e.id} className="group flex items-center gap-3 px-4 py-3">
                        <div className="shrink-0 rounded-lg bg-brand-50 px-2 py-1 text-center">
                          <div className="text-[11px] font-bold text-brand-700">{e.start_time}</div>
                          <div className="text-[10px] text-brand-500">{e.end_time}</div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-slate-800">{e.subject}</div>
                          <div className="text-xs text-slate-500">{e.room || "Room TBA"}</div>
                        </div>
                        {isStaff && (
                          <button
                            onClick={async () => {
                              await deleteTimetableEntry(e.id);
                              await load();
                            }}
                            className="rounded-md p-1 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
                            title="Remove"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add timetable entry">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Branch">
              <Select value={entryBranch} onChange={(e) => setEntryBranch(e.target.value)}>
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </Select>
            </Field>
            <Field label="Semester">
              <Select value={entrySemester} onChange={(e) => setEntrySemester(Number(e.target.value))}>
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Day">
            <Select value={day} onChange={(e) => setDay(Number(e.target.value))}>
              {DAY_LABELS.map((d, i) => (
                <option key={d} value={i}>{d}</option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start">
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </Field>
            <Field label="End">
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </Field>
          </div>
          <Field label="Subject">
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Engineering Physics" />
          </Field>
          <Field label="Room">
            <Input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. A-101" />
          </Field>
          {formError && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{formError}</div>}
          <Button onClick={submit} loading={submitting} className="w-full">
            <Plus className="h-4 w-4" /> Add entry
          </Button>
        </div>
      </Modal>
    </div>
  );
}