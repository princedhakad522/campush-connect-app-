import { useEffect, useState } from "react";
import { ShieldCheck, Users, UserCog, Trash2, Download, ShieldQuestion, Check, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { listUsers, adminUpdateUser, getHomeStats, listRoleRequests, reviewRoleRequest, deleteRoleRequest } from "../lib/api";
import type { Profile, Role, RoleRequest } from "../lib/types";
import {
  PageHeader,
  Button,
  Card,
  Select,
  Spinner,
  ErrorBox,
  SearchInput,
  Badge,
  EmptyState,
  TabList,
} from "../components/ui";
import { cn, firstError, formatDate, initials, isSetupError, timeAgo } from "../lib/utils";

const roleColors: Record<Role, "brand" | "purple" | "green"> = {
  student: "brand",
  teacher: "purple",
  admin: "green",
};

export default function Admin() {
  const { profile: me } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [filter, setFilter] = useState<"all" | Role>("all");
  const [q, setQ] = useState("");
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [confirmUid, setConfirmUid] = useState<string | null>(null);
  const [tab, setTab] = useState<"users" | "requests">("users");

  const load = async () => {
    setLoading(true);
    try {
      const [u, s] = await Promise.all([
        listUsers({ q: q || undefined, role: filter === "all" ? undefined : filter }),
        getHomeStats(),
      ]);
      setUsers(u);
      setStats(s as unknown as Record<string, number>);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [filter, q]);

  const setRole = async (id: string, role: Role) => {
    if (id === me?.id) return;
    try {
      await adminUpdateUser(id, { role });
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
    } catch (err) {
      setError(err);
    }
  };

  const remove = async () => {
    if (!confirmUid) return;
    try {
      const { supabase } = await import("../lib/supabase");
      const { error: rpcErr } = await supabase.rpc("admin_delete_user", { target_user_id: confirmUid });
      if (rpcErr) {
        // fallback: cannot delete auth user via client SDK safely; mark as error message
        setError(new Error(rpcErr.message));
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== confirmUid));
    } catch (err) {
      setError(err);
    } finally {
      setConfirmUid(null);
    }
  };

  const exportCsv = () => {
    const rows = users.map((u) => [u.full_name, u.email, u.role, u.branch ?? "", u.semester ?? "", u.roll_number ?? "", u.faculty_id ?? ""]);
    const header = ["Name", "Email", "Role", "Branch", "Semester", "Roll No", "Faculty ID"];
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "campus-users.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const statCards = [
    { label: "Students", value: users.filter((u) => u.role === "student").length },
    { label: "Teachers", value: users.filter((u) => u.role === "teacher").length },
    { label: "Admins", value: users.filter((u) => u.role === "admin").length },
    { label: "Open items", value: stats?.openLostFound ?? 0 },
  ];

  return (
    <div>
      <PageHeader
        title="Admin Panel"
        subtitle="Manage users, review role requests and see campus activity."
        actions={
          tab === "users" ? (
            <Button size="sm" variant="outline" onClick={exportCsv}>
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
          ) : undefined
        }
      />

      <div className="mb-5">
        <TabList
          tabs={[
            { id: "users", label: "Users", icon: <Users className="h-4 w-4" /> },
            { id: "requests", label: "Role Requests", icon: <ShieldQuestion className="h-4 w-4" /> },
          ]}
          active={tab}
          onChange={(t) => setTab(t as "users" | "requests")}
        />
      </div>

      {tab === "users" && (
        <>      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="text-2xl font-bold text-slate-900">{s.value}</div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{s.label}</div>
          </Card>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
          {(["all", "student", "teacher", "admin"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setFilter(r)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium capitalize transition",
                filter === r ? "bg-brand-600 text-white" : "text-slate-500 hover:text-slate-800"
              )}
            >
              {r}
            </button>
          ))}
        </div>
        <SearchInput value={q} onChange={setQ} placeholder="Search users…" className="w-56" />
      </div>

      {!!error && <ErrorBox error={error} setup={isSetupError(error)} onRetry={load} />}

      {loading ? (
        <Spinner className="mx-auto mt-16" />
      ) : users.length === 0 && !error ? (
        <EmptyState icon={<Users className="h-10 w-10" />} title="No users found" subtitle="Users sign up from the registration page." />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2.5 font-semibold">User</th>
                <th className="px-4 py-2.5 font-semibold">Role</th>
                <th className="px-4 py-2.5 font-semibold">Branch / Sem</th>
                <th className="px-4 py-2.5 font-semibold">Joined</th>
                <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                        {initials(u.full_name)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{u.full_name}</div>
                        <div className="text-xs text-slate-400">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    {u.id === me?.id ? (
                      <Badge color={roleColors[u.role]}>{u.role}</Badge>
                    ) : (
                      <Select
                        value={u.role}
                        onChange={(e) => setRole(u.id, e.target.value as Role)}
                        className="w-auto px-2 py-1 text-xs"
                      >
                        <option value="student">student</option>
                        <option value="teacher">teacher</option>
                        <option value="admin">admin</option>
                      </Select>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">
                    {u.role === "student" ? `${u.branch ?? "—"} · Sem ${u.semester ?? "—"}${u.roll_number ? ` · ${u.roll_number}` : ""}` : u.role === "teacher" ? u.faculty_id ?? "—" : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-2.5 text-right">
                    {u.id !== me?.id && (
                      <button
                        onClick={() => setConfirmUid(u.id)}
                        className="rounded-md p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-600"
                        title="Remove user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {confirmUid && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="mt-20 w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <UserCog className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Remove this user?</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Removing deletes the row from <code className="bg-slate-100 px-1">profiles</code>. To fully remove the
                  sign-in account, run SQL in the dashboard (see below) or use the Auth section.
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setConfirmUid(null)}>
                Cancel
              </Button>
              <Button size="sm" variant="danger" onClick={remove}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <ShieldCheck className="h-4 w-4 text-brand-600" /> Deleting a full account
        </div>
        <p className="mt-1 text-xs text-slate-500">
          To delete an account completely (including sign-in), run in the Supabase SQL editor:
        </p>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-green-300">
{`-- optional (run once):
create or replace function admin_delete_user(target_user_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update auth.users set banned_at = now() where id = target_user_id;
  delete from public.profiles where id = target_user_id;
end; $$;

-- then call:
select admin_delete_user('USER_UUID_HERE');`}
        </pre>
      </div>
        </>
      )}

      {tab === "requests" && <RoleRequestsTab />}
    </div>
  );
}

function RoleRequestsTab() {
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setRequests(await listRoleRequests());
      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const act = async (r: RoleRequest, approve: boolean) => {
    setBusyId(r.id);
    setMsg("");
    try {
      await reviewRoleRequest(r.id, approve);
      setMsg(approve ? `Approved ${r.user?.full_name ?? "user"} as ${r.requested_role}.` : `Rejected request from ${r.user?.full_name ?? "user"}.`);
      await load();
    } catch (err) {
      setMsg(firstError(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      {msg && (
        <div className="mb-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">{msg}</div>
      )}
      {!!error && <ErrorBox error={error} />}
      {loading && <Spinner />}
      {!loading && requests.length === 0 && (
        <EmptyState title="No role requests" subtitle="Requests from students appear here for admin approval." />
      )}
      {!loading && requests.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Requested role</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Requested</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                        {initials(r.user?.full_name ?? "?")}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{r.user?.full_name ?? "Unknown"}</div>
                        <div className="text-xs text-slate-400">{r.user?.email ?? ""}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={r.requested_role === "admin" ? "green" : "purple"}>{r.requested_role}</Badge>
                  </td>
                  <td className="max-w-xs px-4 py-3 text-xs text-slate-500">{r.reason || "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-500" title={formatDate(r.created_at)}>
                    {timeAgo(r.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      color={r.status === "approved" ? "green" : r.status === "rejected" ? "red" : "amber"}
                    >
                      {r.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.status === "pending" ? (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" loading={busyId === r.id} onClick={() => act(r, false)}>
                          <X className="h-3.5 w-3.5" /> Reject
                        </Button>
                        <Button size="sm" loading={busyId === r.id} onClick={() => act(r, true)}>
                          <Check className="h-3.5 w-3.5" /> Approve
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busyId === r.id}
                        onClick={async () => {
                          setBusyId(r.id);
                          try {
                            await deleteRoleRequest(r.id);
                            await load();
                          } finally {
                            setBusyId(null);
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-slate-400" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}