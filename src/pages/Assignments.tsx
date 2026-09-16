import { useEffect, useState } from "react";
import { FileText, Plus, Upload, Download, Users, CheckCircle2, Clock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { listAssignments, createAssignment, submitAssignment, listSubmissions } from "../lib/api";
import type { Assignment, Submission } from "../lib/types";
import {
  PageHeader,
  Button,
  Card,
  Input,
  Field,
  Textarea,
  Select,
  Modal,
  Spinner,
  EmptyState,
  ErrorBox,
  Badge,
} from "../components/ui";
import { BranchSemesterFilter } from "../components/Filters";
import { BRANCHES, SEMESTERS } from "../lib/types";
import { cn, firstError, formatDate, isPastDue, isSetupError } from "../lib/utils";

export default function Assignments() {
  const { isStaff, user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [branch, setBranch] = useState("CSE");
  const [semester, setSemester] = useState<number | null>(null);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [aBranch, setABranch] = useState("CSE");
  const [aSemester, setASemester] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [submitFor, setSubmitFor] = useState<Assignment | null>(null);
  const [submitFile, setSubmitFile] = useState<File | null>(null);
  const [submitMsg, setSubmitMsg] = useState("");

  const [viewSubs, setViewSubs] = useState<Assignment | null>(null);
  const [subList, setSubList] = useState<Submission[]>([]);
  const [subLoading, setSubLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const all = await listAssignments();
      setAssignments(
        all.filter(
          (a) =>
            (!branch || a.branch === branch) && (semester == null || a.semester === semester)
        )
      );
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

  const create = async () => {
    if (!title.trim() || !subject.trim()) {
      setFormError("Title and subject are required.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      await createAssignment({
        title,
        description,
        subject,
        branch: aBranch,
        semester: aSemester,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        file,
      });
      setOpen(false);
      setTitle("");
      setDescription("");
      setSubject("");
      setDueDate("");
      setFile(null);
      await load();
    } catch (err) {
      setFormError(firstError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const doSubmit = async () => {
    if (!submitFor || !submitFile) {
      setSubmitMsg("Please choose a file.");
      return;
    }
    setSubmitMsg("");
    try {
      await submitAssignment(submitFor.id, submitFile);
      setSubmitMsg("Submitted ✓");
      setSubmitFor(null);
      setSubmitFile(null);
      await load();
    } catch (err) {
      setSubmitMsg(firstError(err));
    }
  };

  const openSubmissions = async (a: Assignment) => {
    setViewSubs(a);
    setSubLoading(true);
    setSubList([]);
    try {
      setSubList(await listSubmissions(a.id));
    } catch (err) {
      setSubList([]);
    } finally {
      setSubLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Assignments"
        subtitle="Submit your work on time and stay on top of deadlines."
        actions={
          isStaff && (
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> New assignment
            </Button>
          )
        }
      />

      <div className="mb-4">
        <BranchSemesterFilter branch={branch} setBranch={setBranch} semester={semester} setSemester={setSemester} />
      </div>

      {!!error && <ErrorBox error={error} setup={isSetupError(error)} onRetry={load} />}

      {loading ? (
        <Spinner className="mx-auto mt-16" />
      ) : assignments.length === 0 && !error ? (
        <EmptyState
          icon={<FileText className="h-10 w-10" />}
          title="No assignments"
          subtitle={isStaff ? "Create an assignment for this branch & semester." : "Assignments from your teachers will show up here."}
        />
      ) : (
        <div className="space-y-4">
          {assignments.map((a) => {
            const overdue = isPastDue(a.due_date) && !a.submitted;
            return (
              <Card key={a.id} className={cn("p-5", overdue && "border-red-200")}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">{a.title}</h3>
                      {a.submitted && <Badge color="green"><CheckCircle2 className="mr-1 h-3 w-3" /> Submitted</Badge>}
                      {overdue && <Badge color="red">Overdue</Badge>}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-slate-500">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium">{a.subject}</span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5">{a.branch}</span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5">Sem {a.semester}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{a.description}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                      <span className={cn("inline-flex items-center gap-1", overdue ? "font-semibold text-red-600" : "")}>
                        <Clock className="h-3 w-3" /> Due: {a.due_date ? formatDate(a.due_date) : "TBA"}
                      </span>
                      {a.file_name && (
                        <a href={a.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-brand-600 hover:underline">
                          <Download className="h-3 w-3" /> {a.file_name}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {isStaff ? (
                      <>
                        <Badge color="purple"><Users className="mr-1 h-3 w-3" /> {a.submissions_count ?? 0} submissions</Badge>
                        <Button size="sm" variant="outline" onClick={() => openSubmissions(a)}>
                          View submissions
                        </Button>
                      </>
                    ) : (
                      <>
                        {a.submitted ? (
                          <Badge color="green">Completed</Badge>
                        ) : (
                          <Button size="sm" onClick={() => setSubmitFor(a)}>
                            <Upload className="h-3.5 w-3.5" /> Submit
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create assignment */}
      <Modal open={open} onClose={() => setOpen(false)} title="New assignment" wide>
        <div className="space-y-3">
          <Field label="Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. C Programming Assignment 1" />
          </Field>
          <Field label="Description">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What should students do?" className="min-h-[100px]" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Subject">
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Programming in C" />
            </Field>
            <Field label="Due date">
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Branch">
              <Select value={aBranch} onChange={(e) => setABranch(e.target.value)}>
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </Select>
            </Field>
            <Field label="Semester">
              <Select value={aSemester} onChange={(e) => setASemester(Number(e.target.value))}>
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Attachment (optional)">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full cursor-pointer rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-brand-600 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
            />
          </Field>
          {formError && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{formError}</div>}
          <Button onClick={create} loading={submitting} className="w-full">
            <Plus className="h-4 w-4" /> Create assignment
          </Button>
        </div>
      </Modal>

      {/* Submit assignment */}
      <Modal open={!!submitFor} onClose={() => setSubmitFor(null)} title={`Submit: ${submitFor?.title ?? ""}`}>
        <div className="space-y-3">
          <Field label="Upload your work">
            <input
              type="file"
              onChange={(e) => setSubmitFile(e.target.files?.[0] ?? null)}
              className="block w-full cursor-pointer rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-green-600 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
            />
          </Field>
          {submitMsg && <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">{submitMsg}</div>}
          <Button onClick={doSubmit} variant="secondary" className="w-full">
            <Upload className="h-4 w-4" /> Submit assignment
          </Button>
        </div>
      </Modal>

      {/* View submissions */}
      <Modal open={!!viewSubs} onClose={() => setViewSubs(null)} title={`Submissions: ${viewSubs?.title ?? ""}`} wide>
        {subLoading ? (
          <Spinner className="mx-auto my-8" />
        ) : subList.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">No submissions yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-2 py-2 font-semibold">Student</th>
                <th className="px-2 py-2 font-semibold">Roll</th>
                <th className="px-2 py-2 font-semibold">Submitted</th>
                <th className="px-2 py-2 text-right font-semibold">File</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {subList.map((s) => (
                <tr key={s.id}>
                  <td className="px-2 py-2 font-medium text-slate-800">{s.student?.full_name ?? "Student"}</td>
                  <td className="px-2 py-2 text-slate-500">{s.student?.roll_number ?? "—"}</td>
                  <td className="px-2 py-2 text-slate-500">{formatDate(s.submitted_at)}</td>
                  <td className="px-2 py-2 text-right">
                    <a href={s.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-brand-600 hover:underline">
                      <Download className="h-3.5 w-3.5" /> {s.file_name}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>
    </div>
  );
}