import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import PageHeader from "../components/ui/PageHeader";
import { getErrorMessage } from "../utils/http";
import { Card, CardHeader } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { Input, Select, TextArea } from "../components/ui/Input";

const initialForm = {
  title: "",
  recommendation: "",
  severity: "MEDIUM",
  source: "MANUAL",
  nonConformityId: "",
  dueDate: "",
};

export default function CorrectiveActionsPage() {
  const [state, setState] = useState({ loading: true, data: [], error: "" });
  const [nonConformities, setNonConformities] = useState([]);
  const [filters, setFilters] = useState({ status: "", severity: "", effectivenessStatus: "" });
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState("");

  const queryParams = useMemo(() => {
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.severity) params.severity = filters.severity;
    if (filters.effectivenessStatus) params.effectivenessStatus = filters.effectivenessStatus;
    return params;
  }, [filters]);

  async function loadData() {
    try {
      const [{ data: actionResp }, { data: ncResp }] = await Promise.all([
        api.get("/corrective-actions", { params: queryParams }),
        api.get("/non-conformities"),
      ]);

      setState({ loading: false, data: actionResp.data || [], error: "" });
      setNonConformities(ncResp.data || []);
    } catch (error) {
      setState({ loading: false, data: [], error: getErrorMessage(error) });
    }
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      await loadData();
      if (!mounted) return;
    })();
    return () => {
      mounted = false;
    };
  }, [queryParams.status, queryParams.severity, queryParams.effectivenessStatus]);

  async function handleCreate(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await api.post("/corrective-actions", {
        title: form.title,
        recommendation: form.recommendation || null,
        severity: form.severity,
        source: form.source,
        nonConformityId: form.nonConformityId || null,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      });
      setForm(initialForm);
      await loadData();
    } catch (error) {
      setState((prev) => ({ ...prev, error: getErrorMessage(error) }));
    } finally {
      setSubmitting(false);
    }
  }

  async function quickStatusUpdate(id, status) {
    setUpdatingId(id);
    try {
      await api.patch(`/corrective-actions/${id}`, { status });
      await loadData();
    } catch (error) {
      setState((prev) => ({ ...prev, error: getErrorMessage(error) }));
    } finally {
      setUpdatingId("");
    }
  }

  const totals = useMemo(() => {
    const list = state.data || [];
    return {
      total: list.length,
      open: list.filter((item) => item.status === "OPEN").length,
      inProgress: list.filter((item) => item.status === "IN_PROGRESS").length,
      critical: list.filter((item) => item.severity === "CRITICAL").length,
      pendingVerification: list.filter((item) => item.effectivenessStatus !== "VERIFIED").length,
    };
  }, [state.data]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="CAPA Command Center"
        subtitle="Plan, prioritize, and track corrective/preventive actions with ISO closure controls."
      />

      {state.error ? <div className="saas-card p-4 text-rose-700">{state.error}</div> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Total CAPA</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{totals.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Open</p>
          <p className="mt-2 text-3xl font-semibold text-amber-700">{totals.open}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">In Progress</p>
          <p className="mt-2 text-3xl font-semibold text-sky-700">{totals.inProgress}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Critical CAPA</p>
          <p className="mt-2 text-3xl font-semibold text-rose-800">{totals.critical}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Pending Verification</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{totals.pendingVerification}</p>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card className="p-5">
          <CardHeader
            title="Open Action Portfolio"
            subtitle="Priority-sorted actions for quality steering and escalation."
            action={<Badge tone="amber">{state.data.length}</Badge>}
          />

          <div className="mb-3 grid gap-2 md:grid-cols-3">
            <Select value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}>
              <option value="">All status</option>
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="DONE">DONE</option>
              <option value="CANCELLED">CANCELLED</option>
            </Select>
            <Select value={filters.severity} onChange={(event) => setFilters((prev) => ({ ...prev, severity: event.target.value }))}>
              <option value="">All severity</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </Select>
            <Select value={filters.effectivenessStatus} onChange={(event) => setFilters((prev) => ({ ...prev, effectivenessStatus: event.target.value }))}>
              <option value="">All effectiveness</option>
              <option value="PENDING">PENDING</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="NOT_EFFECTIVE">NOT_EFFECTIVE</option>
            </Select>
          </div>

          {state.loading ? (
            <p className="text-sm text-slate-500">Loading corrective actions...</p>
          ) : state.data.length ? (
            <div className="space-y-2">
              {state.data.map((item) => (
                <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <div className="flex items-center gap-1.5">
                      <Badge tone={item.severity === "CRITICAL" ? "red" : item.severity === "HIGH" ? "amber" : item.severity === "MEDIUM" ? "blue" : "green"}>
                        {item.severity}
                      </Badge>
                      <Badge tone={item.status === "DONE" ? "green" : item.status === "IN_PROGRESS" ? "blue" : item.status === "CANCELLED" ? "slate" : "amber"}>
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    NC: {item.nonConformity?.title || "N/A"} | Effectiveness: {item.effectivenessStatus} | Owner: {item.owner?.fullName || "Unassigned"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.status === "OPEN" ? (
                      <Button
                        variant="subtle"
                        className="text-xs"
                        onClick={() => quickStatusUpdate(item.id, "IN_PROGRESS")}
                        disabled={updatingId === item.id}
                      >
                        Start Action
                      </Button>
                    ) : null}
                    {item.status !== "CANCELLED" && item.status !== "DONE" ? (
                      <Button
                        variant="subtle"
                        className="text-xs"
                        onClick={() => quickStatusUpdate(item.id, "CANCELLED")}
                        disabled={updatingId === item.id}
                      >
                        Cancel
                      </Button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No corrective action found for selected filters.</p>
          )}
        </Card>

        <Card className="p-5">
          <CardHeader title="Create CAPA" subtitle="Register a corrective/preventive action linked to a quality event." />
          <form className="space-y-2" onSubmit={handleCreate}>
            <div className="field-group">
              <label className="field-label">Action Title</label>
              <Input
                required
                value={form.title}
                placeholder="e.g. Implement second-level review before release"
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              />
            </div>
            <div className="field-group">
              <label className="field-label">Recommendation</label>
              <TextArea
                rows={3}
                value={form.recommendation}
                placeholder="State corrective action steps, owner expectations, and success criteria."
                onChange={(event) => setForm((prev) => ({ ...prev, recommendation: event.target.value }))}
              />
            </div>
            <div className="field-group">
              <label className="field-label">Severity</label>
              <Select value={form.severity} onChange={(event) => setForm((prev) => ({ ...prev, severity: event.target.value }))}>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </Select>
            </div>
            <div className="field-group">
              <label className="field-label">Source</label>
              <Select value={form.source} onChange={(event) => setForm((prev) => ({ ...prev, source: event.target.value }))}>
                <option value="MANUAL">MANUAL</option>
                <option value="OVERDUE_TASK">OVERDUE_TASK</option>
                <option value="DELAYED_PROJECT">DELAYED_PROJECT</option>
                <option value="KPI_DEVIATION">KPI_DEVIATION</option>
              </Select>
            </div>
            <div className="field-group">
              <label className="field-label">Linked Non-Conformity</label>
              <Select value={form.nonConformityId} onChange={(event) => setForm((prev) => ({ ...prev, nonConformityId: event.target.value }))}>
                <option value="">Select non-conformity (optional)</option>
                {nonConformities.map((item) => (
                  <option key={item.id} value={item.id}>{item.title}</option>
                ))}
              </Select>
            </div>
            <div className="field-group">
              <label className="field-label">Due Date</label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
              />
              <p className="field-help">Set a realistic completion date aligned with risk severity.</p>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Saving..." : "Create Corrective Action"}
            </Button>
          </form>
        </Card>
      </section>
    </div>
  );
}
