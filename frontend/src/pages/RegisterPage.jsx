import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { getErrorMessage } from "../utils/http";
import { Card, CardHeader } from "../components/ui/Card";
import { Input, Select } from "../components/ui/Input";
import Button from "../components/ui/Button";

export default function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const loading = useAuthStore((state) => state.loading);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "TEAM_MEMBER",
  });
  const [error, setError] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl items-center p-4">
      <Card className="w-full p-8">
        <CardHeader title="Create account" subtitle="Access the ESI ISO 9001 project workspace." />

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-sm text-slate-600">Full name</label>
            <Input
              value={form.fullName}
              onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
              required
            />
          </div>

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

          <div>
            <label className="mb-1 block text-sm text-slate-600">Role</label>
            <Select
              value={form.role}
              onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
            >
              <option value="TEAM_MEMBER">Team Member</option>
              <option value="PROJECT_MANAGER">Project Manager</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </div>

          {error ? <p className="text-sm text-rose-700">{error}</p> : null}

          <Button className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Register"}
          </Button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Already have an account? <Link className="font-semibold text-emerald-700" to="/login">Sign in</Link>
        </p>
      </Card>
    </div>
  );
}
