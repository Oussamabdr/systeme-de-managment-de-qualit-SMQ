import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { getErrorMessage } from "../utils/http";
import { Card, CardHeader } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import Button from "../components/ui/Button";

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);

  const [form, setForm] = useState({ email: "admin@esi.edu", password: "Password123!" });
  const [error, setError] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      await login(form);
      navigate("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl items-center p-4">
      <div className="grid w-full gap-6 md:grid-cols-2">
        <Card className="p-8">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">ISO 9001</p>
          <h1 className="mt-2 text-4xl font-semibold text-slate-950">QMS Project Console</h1>
          <p className="mt-4 text-slate-600 leading-relaxed">
            Coordinate processes, projects, tasks, and compliance evidence for ESI.
          </p>
          <div className="mt-8 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Demo credentials are pre-filled.
          </div>
        </Card>

        <Card className="p-8">
          <CardHeader title="Sign in" subtitle="Access your workspace." />
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="mb-1 block text-sm text-slate-600">Email</label>
              <Input
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-600">Password</label>
              <Input
                type="password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                required
              />
            </div>

            {error ? <p className="text-sm text-rose-700">{error}</p> : null}

            <Button className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </Button>
          </form>
          <p className="mt-4 text-sm text-slate-600">
            New account? <Link className="font-semibold text-emerald-700" to="/register">Register</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
