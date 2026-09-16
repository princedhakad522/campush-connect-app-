import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, ShieldCheck } from "lucide-react";
import { signUpUser } from "../lib/api";
import { BRANCHES, SEMESTERS } from "../lib/types";
import { Button, Field, Input, Select } from "../components/ui";
import { firstError } from "../lib/utils";

export default function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [branch, setBranch] = useState("CSE");
  const [semester, setSemester] = useState(1);
  const [rollNumber, setRollNumber] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const result = await signUpUser({
        email,
        password,
        fullName,
        role: "student",
        branch,
        semester,
        rollNumber,
      });
      if (result.session) {
        navigate("/");
      } else {
        setMessage("Account created! Check your email to confirm, then sign in.");
      }
      setLoading(false);
    } catch (err) {
      setError(firstError(err));
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Campus Connect</h1>
          <p className="text-sm text-slate-500">Create your student account</p>
        </div>

        {/* Role security notice */}
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-xs leading-relaxed text-amber-800">
              <span className="font-semibold">All new accounts are student accounts.</span>{" "}
              Teachers and admins request elevated access from their{" "}
              <Link to="/profile" className="font-semibold underline">profile</Link> after signing up — an admin reviews the request.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">Sign up as a student</h2>
          <div className="space-y-3">
            <Field label="Full name">
              <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Aarav Sharma" />
            </Field>
            <Field label="Email">
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Password">
                <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 chars" />
              </Field>
              <Field label="Confirm password">
                <Input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Branch">
                <Select value={branch} onChange={(e) => setBranch(e.target.value)}>
                  {BRANCHES.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Semester">
                <Select value={semester} onChange={(e) => setSemester(Number(e.target.value))}>
                  {SEMESTERS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Roll number (optional)">
              <Input value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} placeholder="e.g. 24CSE0101" />
            </Field>
          </div>

          {error && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>}
          {message && <div className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">{message}</div>}

          <Button type="submit" loading={loading} className="mt-4 w-full">
            Create student account
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}