import { useEffect, useState, type FormEvent } from "react";
import { UserRound, Mail, BookOpen, Hash, IdCard, Save, Camera, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { updateProfile, createRoleRequest, getMyRoleRequest } from "../lib/api";
import { supabase } from "../lib/supabase";
import type { RoleRequest } from "../lib/types";
import { BRANCHES, SEMESTERS } from "../lib/types";
import { PageHeader, Button, Card, Input, Field, Select, Badge, Spinner } from "../components/ui";
import { cn, firstError, initials, formatDate, timeAgo } from "../lib/utils";

export default function Profile() {
  const { profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [branch, setBranch] = useState("CSE");
  const [semester, setSemester] = useState(1);
  const [rollNumber, setRollNumber] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [roleRequest, setRoleRequest] = useState<RoleRequest | null>(null);
  const [reqRole, setReqRole] = useState<"teacher" | "admin">("teacher");
  const [reqReason, setReqReason] = useState("");
  const [reqSubmitting, setReqSubmitting] = useState(false);
  const [reqMsg, setReqMsg] = useState("");

  useEffect(() => {
    if (profile?.role === "student") {
      getMyRoleRequest().then(setRoleRequest).catch(() => {});
    }
  }, [profile?.role]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setBranch(profile.branch ?? "CSE");
      setSemester(profile.semester ?? 1);
      setRollNumber(profile.roll_number ?? "");
      setFacultyId(profile.faculty_id ?? "");
    }
  }, [profile]);

  if (!profile) return <Spinner className="mx-auto mt-20" />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      let avatarUrl: string | undefined;
      if (avatar) {
        const path = `${profile.id}/${Date.now()}-${avatar.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        await supabase.storage.from("avatars").upload(path, avatar, { upsert: true });
        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = data.publicUrl;
      }
      await updateProfile(profile.id, {
        full_name: fullName,
        branch: profile.role === "student" ? branch : profile.branch,
        semester: profile.role === "student" ? semester : profile.semester,
        roll_number: profile.role === "student" ? rollNumber : profile.roll_number,
        faculty_id: profile.role === "teacher" ? facultyId : profile.faculty_id,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      });
      await refreshProfile();
      setMessage("Profile updated ✓");
    } catch (err) {
      setError(firstError(err));
    } finally {
      setSaving(false);
    }
  };

  const roleColor = profile.role === "admin" ? "green" : profile.role === "teacher" ? "purple" : "brand";

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Your campus identity and settings." />

      <form onSubmit={submit} className="max-w-2xl space-y-5">
        <Card className="p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-bold text-white">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="avatar" className="h-full w-full rounded-2xl object-cover" />
                ) : (
                  initials(profile.full_name)
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-brand-600 text-white shadow hover:bg-brand-700">
                <Camera className="h-3.5 w-3.5" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setAvatar(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{profile.full_name}</h2>
                <Badge color={roleColor}>{profile.role}</Badge>
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
                <Mail className="h-3.5 w-3.5" /> {profile.email}
              </div>
              <div className="mt-0.5 text-xs text-slate-400">Joined {formatDate(profile.created_at)}</div>
            </div>
          </div>
        </Card>

        <Card className="space-y-3 p-5">
          <h3 className="text-sm font-semibold text-slate-700">Account details</h3>
          <Field label="Full name">
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-9" />
            </div>
          </Field>
          <Field label="Email">
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={profile.email} disabled className="pl-9 opacity-60" />
            </div>
          </Field>

          {profile.role === "student" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Branch">
                <div className="relative">
                  <BookOpen className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Select value={branch} onChange={(e) => setBranch(e.target.value)} className="pl-9">
                    {BRANCHES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </Select>
                </div>
              </Field>
              <Field label="Semester">
                <Select value={semester} onChange={(e) => setSemester(Number(e.target.value))}>
                  {SEMESTERS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </Field>
            </div>
          )}

          {profile.role === "student" && (
            <Field label="Roll number">
              <div className="relative">
                <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} className="pl-9" placeholder="e.g. 24CSE0101" />
              </div>
            </Field>
          )}

          {profile.role === "teacher" && (
            <Field label="Faculty ID">
              <div className="relative">
                <IdCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input value={facultyId} onChange={(e) => setFacultyId(e.target.value)} className="pl-9" placeholder="e.g. FAC-2024-01" />
              </div>
            </Field>
          )}

          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>}
          {message && <div className="rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">{message}</div>}

          <Button type="submit" loading={saving} className={cn(avatar ? "w-full" : "mt-1")}>
            <Save className="h-4 w-4" /> Save changes
          </Button>
        </Card>

        {profile?.role === "student" && (
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-600" />
              <h3 className="text-sm font-semibold text-slate-700">Request staff access</h3>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Need a Teacher or Admin account? Request access here — an existing admin reviews all requests.
            </p>

            {roleRequest ? (
              <div className="mt-3 rounded-lg border border-slate-200 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">Requested role:</span>
                  <Badge color={roleRequest.requested_role === "admin" ? "green" : "purple"}>{roleRequest.requested_role}</Badge>
                  <Badge
                    color={
                      roleRequest.status === "approved"
                        ? "green"
                        : roleRequest.status === "rejected"
                          ? "red"
                          : "amber"
                    }
                  >
                    {roleRequest.status}
                  </Badge>
                  <span className="ml-auto text-[10px] text-slate-400">{timeAgo(roleRequest.created_at)}</span>
                </div>
                {roleRequest.reason && (
                  <p className="mt-1.5 text-xs text-slate-500">"{roleRequest.reason}"</p>
                )}
                {roleRequest.status === "rejected" && (
                  <p className="mt-1.5 text-xs text-amber-700">Request was rejected — you may submit another.</p>
                )}
                {roleRequest.status !== "pending" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => setRoleRequest(null)}
                  >
                    Submit new request
                  </Button>
                )}
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setReqRole("teacher")}
                    className={cn(
                      "rounded-lg border px-3 py-2.5 text-sm font-semibold transition",
                      reqRole === "teacher"
                        ? "border-purple-300 bg-purple-50 text-purple-700"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    Request Teacher
                  </button>
                  <button
                    onClick={() => setReqRole("admin")}
                    className={cn(
                      "rounded-lg border px-3 py-2.5 text-sm font-semibold transition",
                      reqRole === "admin"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    Request Admin
                  </button>
                </div>
                <Field label="Reason (optional)">
                  <Input
                    value={reqReason}
                    onChange={(e) => setReqReason(e.target.value)}
                    placeholder="e.g. 'I'm a faculty member — Class 10 faculty'"
                  />
                </Field>
                {reqMsg && <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">{reqMsg}</div>}
                <Button
                  size="sm"
                  loading={reqSubmitting}
                  onClick={async () => {
                    setReqSubmitting(true);
                    setReqMsg("");
                    try {
                      await createRoleRequest({ requestedRole: reqRole, reason: reqReason });
                      setReqMsg("Request submitted ✓ — an admin will review it.");
                      await getMyRoleRequest().then(setRoleRequest);
                    } catch (err) {
                      setReqMsg(firstError(err));
                    } finally {
                      setReqSubmitting(false);
                    }
                  }}
                >
                  <ShieldCheck className="h-3.5 w-3.5" /> Submit request
                </Button>
              </div>
            )}
          </Card>
        )}

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-700">Account & security</h3>
          <p className="mt-1 text-xs text-slate-500">Change your password through Supabase Auth using your email.</p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={async () => {
              const { supabase } = await import("../lib/supabase");
              const { error } = await supabase.auth.resetPasswordForEmail(profile.email);
              if (error) setError(error.message);
              else setMessage("Password reset email sent ✓");
            }}
          >
            Send password reset email
          </Button>
        </Card>

        <div className="text-center text-xs text-slate-400">
          <Link to="/" className="font-medium text-brand-600 hover:underline">← Back to home</Link>
        </div>
      </form>
    </div>
  );
}