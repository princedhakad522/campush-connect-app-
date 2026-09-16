import { useEffect, useState } from "react";
import { School, Plus, BookOpen } from "lucide-react";
import { listDepartments, addDepartment, listSubjects, addSubject } from "../lib/api";
import type { Department, Subject } from "../lib/types";
import {
  PageHeader,
  Button,
  Card,
  Input,
  Field,
  Modal,
  Spinner,
  EmptyState,
  ErrorBox,
  Badge,
  TabList,
} from "../components/ui";
import { firstError, isSetupError } from "../lib/utils";

function DepartmentsTab() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setDepartments(await listDepartments());
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!name.trim() || !code.trim()) {
      setFormError("Name and code are required.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      await addDepartment({ name, code, description });
      setOpen(false);
      setName("");
      setCode("");
      setDescription("");
      await load();
    } catch (err) {
      setFormError(firstError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Add department
        </Button>
      </div>
      {!!error && <ErrorBox error={error} setup={isSetupError(error)} onRetry={load} />}
      {loading ? (
        <Spinner className="mx-auto mt-10" />
      ) : departments.length === 0 && !error ? (
        <EmptyState icon={<School className="h-10 w-10" />} title="No departments yet" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((d) => (
            <Card key={d.id} className="p-4">
              <Badge color="brand">{d.code}</Badge>
              <h3 className="mt-2 text-sm font-semibold text-slate-800">{d.name}</h3>
              {d.description && <p className="mt-1 text-xs text-slate-500">{d.description}</p>}
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add department">
        <div className="space-y-3">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. B.Tech Data Science" />
          </Field>
          <Field label="Code">
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. DS" />
          </Field>
          <Field label="Description (optional)">
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description…" />
          </Field>
          {formError && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{formError}</div>}
          <Button onClick={create} loading={submitting} className="w-full">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </Modal>
    </>
  );
}

function SubjectsTab() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [branch, setBranch] = useState("CSE");
  const [semester, setSemester] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [filter, setFilter] = useState<{ branch: string; semester: number | null }>({ branch: "CSE", semester: null });

  const load = async () => {
    setLoading(true);
    try {
      setSubjects(await listSubjects({ branch: filter.branch, semester: filter.semester ?? undefined }));
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter]);

  const create = async () => {
    if (!name.trim() || !code.trim()) {
      setFormError("Name and code are required.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      await addSubject({ name, code, branch, semester });
      setOpen(false);
      setName("");
      setCode("");
      await load();
    } catch (err) {
      setFormError(firstError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <select
            value={filter.branch}
            onChange={(e) => setFilter((f) => ({ ...f, branch: e.target.value }))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            {["CSE", "IT", "ECE", "ME", "CE", "AIML", "BCA", "BBA"].map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <select
            value={filter.semester ?? ""}
            onChange={(e) => setFilter((f) => ({ ...f, semester: e.target.value ? Number(e.target.value) : null }))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">All semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>Sem {s}</option>
            ))}
          </select>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Add subject
        </Button>
      </div>
      {!!error && <ErrorBox error={error} setup={isSetupError(error)} onRetry={load} />}
      {loading ? (
        <Spinner className="mx-auto mt-10" />
      ) : subjects.length === 0 && !error ? (
        <EmptyState icon={<BookOpen className="h-10 w-10" />} title="No subjects yet" />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2.5 font-semibold">Subject</th>
                <th className="px-4 py-2.5 font-semibold">Code</th>
                <th className="px-4 py-2.5 font-semibold">Branch</th>
                <th className="px-4 py-2.5 font-semibold">Semester</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {subjects.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-2.5 font-medium text-slate-800">{s.name}</td>
                  <td className="px-4 py-2.5 text-slate-500">{s.code}</td>
                  <td className="px-4 py-2.5 text-slate-500">{s.branch}</td>
                  <td className="px-4 py-2.5">
                    <Badge color="brand">Sem {s.semester}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add subject">
        <div className="space-y-3">
          <Field label="Subject name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Digital Electronics" />
          </Field>
          <Field label="Code">
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. EC201" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Branch">
              <input
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="e.g. CSE"
              />
            </Field>
            <Field label="Semester">
              <input
                type="number"
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </Field>
          </div>
          {formError && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{formError}</div>}
          <Button onClick={create} loading={submitting} className="w-full">
            <Plus className="h-4 w-4" /> Add subject
          </Button>
        </div>
      </Modal>
    </>
  );
}

export default function Departments() {
  const [tab, setTab] = useState<"departments" | "subjects">("departments");

  return (
    <div>
      <PageHeader
        title="Departments & Subjects"
        subtitle="Manage the branches, departments and subjects available in the app."
      />
      <TabList
        tabs={[
          { id: "departments", label: "Departments", icon: <School className="h-4 w-4" /> },
          { id: "subjects", label: "Subjects", icon: <BookOpen className="h-4 w-4" /> },
        ]}
        active={tab}
        onChange={(t) => setTab(t as typeof tab)}
      />
      <div className="mt-4">{tab === "departments" ? <DepartmentsTab /> : <SubjectsTab />}</div>
    </div>
  );
}