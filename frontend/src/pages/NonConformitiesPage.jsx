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
  description: "",
  severity: "MEDIUM",
  processId: "",
};

export default function NonConformitiesPage() {
  const [state, setState] = useState({ loading: true, data: [], error: "" });
  const [processes, setProcesses] = useState([]);
  const [filters, setFilters] = useState({ status: "", severity: "" });
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState("");

  const queryParams = useMemo(() => {
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.severity) params.severity = filters.severity;
    return params;
  }, [filters]);

  async function loadData() {
    try {
      const [{ data: ncResp }, { data: processResp }] = await Promise.all([
        api.get("/non-conformities", { params: queryParams }),
        api.get("/processes"),
      ]);

      setState({ loading: false, data: ncResp.data || [], error: "" });
      setProcesses(processResp.data || []);
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
  }, [queryParams.status, queryParams.severity]);

  async function handleCreate(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await api.post("/non-conformities", {
        title: form.title,
        description: form.description || null,
        severity: form.severity,
        processId: form.processId || null,
      });
      setForm(initialForm);
      await loadData();
    } catch (error) {
      setState((prev) => ({ ...prev, error: getErrorMessage(error) }));
    } finally {
      setSubmitting(false);
    }
  }

  async function quickUpdateStatus(id, status) {
    setUpdatingId(id);
    try {
      await api.patch(`/non-conformities/${id}`, { status });
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
      analysis: list.filter((item) => item.status === "ANALYSIS").length,
      critical: list.filter((item) => item.severity === "CRITICAL").length,
    };
  }, [state.data]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Non-Conformity Control Register"
        subtitle="Central register for quality deviations, root-cause tracking, and CAPA linkage."
      />

      {state.error ? <div className="saas-card p-4 text-rose-700">{state.error}</div> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Total NC</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{totals.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Open</p>
          <p className="mt-2 text-3xl font-semibold text-rose-700">{totals.open}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">In Analysis</p>
          <p className="mt-2 text-3xl font-semibold text-amber-700">{totals.analysis}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Critical NC</p>
          <p className="mt-2 text-3xl font-semibold text-rose-800">{totals.critical}</p>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Card className="p-5">
          <CardHeader
            title="Open Register"
            subtitle="Governance view of deviations by severity and lifecycle status."
            action={<Badge tone="amber">{state.data.length}</Badge>}
          />

          <div className="mb-3 grid gap-2 sm:grid-cols-2">
            <Select value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}>
              <option value="">All statuses</option>
              <option value="OPEN">OPEN</option>
              <option value="ANALYSIS">ANALYSIS</option>
              <option value="CLOSED">CLOSED</option>
            </Select>
            <Select value={filters.severity} onChange={(event) => setFilters((prev) => ({ ...prev, severity: event.target.value }))}>
              <option value="">All severities</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </Select>
          </div>

          {state.loading ? (
            <p className="text-sm text-slate-500">Loading non-conformities...</p>
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
                      <Badge tone={item.status === "CLOSED" ? "green" : item.status === "ANALYSIS" ? "amber" : "red"}>
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    Process: {item.process?.name || "Not linked"} | CAPA linked: {item.correctiveActions?.length || 0}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.status !== "ANALYSIS" ? (
                      <Button
                        variant="subtle"
                        className="text-xs"
                        onClick={() => quickUpdateStatus(item.id, "ANALYSIS")}
                        disabled={updatingId === item.id}
                      >
                        Move to Analysis
                      </Button>
                    ) : null}
                    {item.status !== "CLOSED" ? (
                      <Button
                        variant="subtle"
                        className="text-xs"
                        onClick={() => quickUpdateStatus(item.id, "CLOSED")}
                        disabled={updatingId === item.id}
                      >
                        Attempt Close
                      </Button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No non-conformity found for selected filters.</p>
          )}
        </Card>

        <Card className="p-5">
          <CardHeader title="Declare Non-Conformity" subtitle="Capture deviation evidence to trigger controlled corrective actions." />
          <form className="space-y-2" onSubmit={handleCreate}>
            <div className="field-group">
              <label className="field-label">Non-Conformity Title</label>
              <Input
                required
                value={form.title}
                placeholder="e.g. Calibration record missing for lab equipment"
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              />
            </div>
            <div className="field-group">
              <label className="field-label">Description and Evidence</label>
              <TextArea
                value={form.description}
                rows={4}
                placeholder="Describe what happened, where it was detected, and available evidence."
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
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
              <label className="field-label">Related Process</label>
              <Select value={form.processId} onChange={(event) => setForm((prev) => ({ ...prev, processId: event.target.value }))}>
                <option value="">Select process (optional)</option>
                {processes.map((process) => (
                  <option key={process.id} value={process.id}>{process.name}</option>
                ))}
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Saving..." : "Create Non-Conformity"}
            </Button>
          </form>
        </Card>
      </section>
    </div>
  );
}
