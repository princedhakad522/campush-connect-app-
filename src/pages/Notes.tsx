import { useEffect, useMemo, useState } from "react";
import { BookOpen, Upload, Download, Trash2, FileText } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { listNotes, uploadNote, deleteNote } from "../lib/api";
import type { Note } from "../lib/types";
import {
  PageHeader,
  Button,
  Card,
  Input,
  Field,
  Select,
  Textarea,
  Modal,
  Spinner,
  EmptyState,
  ErrorBox,
  SearchInput,
} from "../components/ui";
import { BranchSemesterFilter } from "../components/Filters";
import { BRANCHES, SEMESTERS } from "../lib/types";
import { cn, firstError, formatDate, isSetupError, truncate, fileSizeLabel } from "../lib/utils";

export default function Notes() {
  const { isStaff, user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [branch, setBranch] = useState("CSE");
  const [semester, setSemester] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [q, setQ] = useState("");

  const [uploadOpen, setUploadOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploadSubject, setUploadSubject] = useState("");
  const [uploadBranch, setUploadBranch] = useState("CSE");
  const [uploadSemester, setUploadSemester] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setNotes(await listNotes({ branch, semester: semester ?? undefined, subject: subject || undefined, q: q || undefined }));
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [branch, semester, subject]);

  const filtered = useMemo(() => {
    if (!q) return notes;
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q.toLowerCase()) ||
        n.subject.toLowerCase().includes(q.toLowerCase())
    );
  }, [notes, q]);

  const submit = async () => {
    if (!file || !title) {
      setFormError("Title and file are required.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      await uploadNote({
        title,
        description,
        subject: uploadSubject || "General",
        branch: uploadBranch,
        semester: uploadSemester,
        file,
      });
      setUploadOpen(false);
      resetForm();
      await load();
    } catch (err) {
      setFormError(firstError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setUploadSubject("");
    setFile(null);
  };

  const handleDownload = (url: string, name: string) => {
    window.open(url, "_blank");
    void name;
  };

  return (
    <div>
      <PageHeader
        title="Notes & Study Material"
        subtitle="Notes, PDFs, previous year papers and important questions — filtered by branch & semester."
        actions={
          isStaff && (
            <Button onClick={() => setUploadOpen(true)}>
              <Upload className="h-4 w-4" /> Upload notes
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <BranchSemesterFilter branch={branch} setBranch={setBranch} semester={semester} setSemester={setSemester} />
        <SearchInput value={q} onChange={setQ} placeholder="Search notes…" className="w-56" />
      </div>

      {!!error && <ErrorBox error={error} setup={isSetupError(error)} onRetry={load} />}

      {loading ? (
        <Spinner className="mx-auto mt-16" />
      ) : filtered.length === 0 && !error ? (
        <EmptyState
          icon={<BookOpen className="h-10 w-10" />}
          title="No notes here yet"
          subtitle={isStaff ? "Upload the first note for this branch & semester." : "Check back soon — teachers add notes regularly."}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((n) => (
            <Card key={n.id} className="flex flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <FileText className="h-5 w-5" />
                </div>
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                  {n.file_type || "FILE"}
                </span>
              </div>
              <h3 className="mt-2 text-sm font-semibold text-slate-800">{n.title}</h3>
              {n.description && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{truncate(n.description, 100)}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium">{n.subject}</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5">{n.branch}</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5">Sem {n.semester}</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <div className="text-[11px] text-slate-400">
                  {n.uploader?.full_name ? `by ${n.uploader.full_name}` : "Staff"} · {formatDate(n.created_at)}
                </div>
                <div className="flex items-center gap-1">
                  {user && n.uploader_id === user.id && (
                    <button
                      onClick={async () => {
                        await deleteNote(n.id);
                        await load();
                      }}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDownload(n.file_url, n.file_name)}
                    className="rounded-md bg-brand-50 p-1.5 text-brand-600 hover:bg-brand-100"
                    title="Open file"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload study material">
        <div className="space-y-3">
          <Field label="Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Engineering Physics - Unit 1 Notes" />
          </Field>
          <Field label="Description (optional)">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short summary of this material…" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Branch">
              <Select value={uploadBranch} onChange={(e) => setUploadBranch(e.target.value)}>
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </Select>
            </Field>
            <Field label="Semester">
              <Select value={uploadSemester} onChange={(e) => setUploadSemester(Number(e.target.value))}>
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Subject">
            <Input value={uploadSubject} onChange={(e) => setUploadSubject(e.target.value)} placeholder="e.g. Engineering Physics" />
          </Field>
          <Field label="File (PDF, DOC, PPT, etc.)">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className={cn(
                "block w-full cursor-pointer rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-brand-600 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
              )}
            />
            {file && (
              <div className="mt-1 text-xs text-slate-500">
                {file.name} ({fileSizeLabel(file.size)})
              </div>
            )}
          </Field>
          {formError && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{formError}</div>}
          <Button onClick={submit} loading={submitting} className="w-full">
            <Upload className="h-4 w-4" /> Upload
          </Button>
        </div>
      </Modal>
    </div>
  );
}