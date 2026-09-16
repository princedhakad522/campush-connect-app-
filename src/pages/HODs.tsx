import { useEffect, useMemo, useState } from "react";
import { GraduationCap, Mail, Phone, Plus, Trash2, Pencil, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { listFaculty, addFaculty, updateFaculty, deleteFaculty } from "../lib/api";
import type { Faculty } from "../lib/types";
import { DEPARTMENT_LIST } from "../lib/types";
import {
  PageHeader,
  Button,
  Card,
  Field,
  Input,
  Select,
  Textarea,
  Modal,
  Spinner,
  EmptyState,
  ErrorBox,
  Badge,
  SearchInput,
} from "../components/ui";
import { firstError, isSetupError } from "../lib/utils";

export default function HODs() {
  const { isAdmin } = useAuth();
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Faculty | null>(null);
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("Computer Science & Engineering");
  const [role, setRole] = useState<"HOD" | "Faculty">("HOD");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setFaculty(await listFaculty());
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

  const filtered = useMemo(() => {
    return faculty.filter(
      (f) =>
        (!dept || f.department === dept) &&
        (!q ||
          f.name.toLowerCase().includes(q.toLowerCase()) ||
          f.designation.toLowerCase().includes(q.toLowerCase()) ||
          f.department.toLowerCase().includes(q.toLowerCase()))
    );
  }, [faculty, q, dept]);

  const hods = filtered.filter((f) => f.role === "HOD");
  const members = filtered.filter((f) => f.role !== "HOD");

  const openAdd = () => {
    setEditing(null);
    setName(""); setDesignation(""); setDepartment("Computer Science & Engineering");
    setRole("HOD"); setEmail(""); setPhone(""); setBio("");
    setOpen(true);
  };

  const openEdit = (f: Faculty) => {
    setEditing(f);
    setName(f.name); setDesignation(f.designation); setDepartment(f.department);
    setRole(f.role); setEmail(f.email ?? ""); setPhone(f.phone ?? ""); setBio(f.bio ?? "");
    setOpen(true);
  };

  const submit = async () => {
    if (!name.trim()) { setFormError("Name is required."); return; }
    setSubmitting(true);
    setFormError("");
    const payload = { name, designation: designation || "Professor", department, role, email, phone, bio };
    try {
      if (editing) await updateFaculty(editing.id, payload);
      else await addFaculty(payload);
      setOpen(false);
      await load();
    } catch (err) {
      setFormError(firstError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const header =
    role === "HOD" ? "Heads of Departments" : "Faculty & Staff";

  return (
    <div>
      <PageHeader
        title="Faculty & HODs"
        subtitle="Department heads and teaching faculty of SATI Vidisha."
        actions={
          isAdmin ? (
            <Button onClick={openAdd}><Plus className="h-4 w-4" /> Add faculty</Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select value={dept} onChange={(e) => setDept(e.target.value)} className="w-64">
          <option value="">All departments</option>
          {DEPARTMENT_LIST.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </Select>
        <SearchInput value={q} onChange={setQ} placeholder="Search faculty…" className="w-56" />
      </div>

      {!!error && <ErrorBox error={error} setup={isSetupError(error)} onRetry={load} />}

      {loading ? (
        <Spinner className="mx-auto mt-16" />
      ) : filtered.length === 0 && !error ? (
        <EmptyState
          icon={<GraduationCap className="h-10 w-10" />}
          title="No faculty listed"
          subtitle={isAdmin ? "Add your first faculty member." : "Faculty directory will appear here."}
        />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-600">
              <GraduationCap className="h-4 w-4 text-brand-600" /> {header}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {hods.map((f) => (
                <Card key={f.id} className="flex flex-col p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                      {f.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-slate-800">{f.name}</h3>
                      <p className="truncate text-xs text-slate-500">{f.designation}</p>
                    </div>
                    <Badge color="brand" className="ml-auto">{f.role}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{f.department}</p>
                  {f.bio && <p className="mt-2 line-clamp-3 text-xs text-slate-500">{f.bio}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                    {f.email && (
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {f.email}</span>
                    )}
                    {f.phone && (
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {f.phone}</span>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="mt-2 flex gap-1 text-slate-400">
                      <button onClick={() => openEdit(f)} className="rounded p-1 hover:bg-slate-100 hover:text-slate-700"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={async () => { await deleteFaculty(f.id); await load(); }} className="rounded p-1 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  )}
                </Card>
              ))}
              {hods.length === 0 && (
                <p className="text-xs text-slate-500">No HODs in this view.</p>
              )}
            </div>
          </section>

          {members.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-600">
                <Search className="h-4 w-4 text-brand-600" /> Other Faculty
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {members.map((f) => (
                  <Card key={f.id} className="flex items-center gap-3 p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                      {f.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-slate-800">{f.name}</div>
                      <div className="truncate text-xs text-slate-500">{f.designation} · {f.department}</div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1 text-slate-400">
                        <button onClick={() => openEdit(f)} className="rounded p-1 hover:bg-slate-100 hover:text-slate-700"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={async () => { await deleteFaculty(f.id); await load(); }} className="rounded p-1 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit faculty" : "Add faculty"}>
        <div className="space-y-3">
          <Field label="Full name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dr. Rakesh Kumar Verma" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Designation">
              <Input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="Professor" />
            </Field>
            <Field label="Role">
              <Select value={role} onChange={(e) => setRole(e.target.value as "HOD" | "Faculty")}>
                <option value="HOD">HOD</option>
                <option value="Faculty">Faculty</option>
              </Select>
            </Field>
          </div>
          <Field label="Department">
            <Select value={department} onChange={(e) => setDepartment(e.target.value)}>
              {DEPARTMENT_LIST.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@sati.ac.in" />
            </Field>
            <Field label="Phone">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" />
            </Field>
          </div>
          <Field label="Bio (optional)">
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Research interests, expertise…" />
          </Field>
          {formError && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{formError}</div>}
          <Button onClick={submit} loading={submitting} className="w-full">
            {editing ? "Update" : "Add faculty"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}