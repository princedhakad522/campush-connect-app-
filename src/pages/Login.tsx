import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Mail, Lock } from "lucide-react";
import { loginUser } from "../lib/api";
import { Button, Field, Input } from "../components/ui";
import { firstError } from "../lib/utils";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginUser(email, password);
      navigate("/");
    } catch (err) {
      setError(firstError(err));
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-slate-100 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Campus Connect</h1>
          <p className="text-sm text-slate-500">Your Campus. Your Community. One App.</p>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">Sign in to your account</h2>
          <div className="space-y-3">
            <Field label="Email">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@college.edu"
                  className="pl-9"
                />
              </div>
            </Field>
            <Field label="Password">
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9"
                />
              </div>
            </Field>
          </div>
          {error && (
            <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>
          )}
          <Button type="submit" loading={loading} className="mt-4 w-full">
            Sign in
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          New to Campus Connect?{" "}
          <Link to="/register" className="font-semibold text-brand-600 hover:underline">
            Create an account
          </Link>
        </p>

        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white/60 p-3 text-center text-xs text-slate-500">
          First time? Sign up from the app and pick Student / Teacher / Admin. Run{" "}
          <code className="rounded bg-slate-100 px-1">0001_schema.sql</code> in the SQL editor first.
        </div>
      </div>
    </div>
  );
}