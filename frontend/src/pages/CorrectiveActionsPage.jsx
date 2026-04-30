import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import PageHeader from "../components/ui/PageHeader";
import { getErrorMessage } from "../utils/http";
import { Card, CardHeader } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { Select } from "../components/ui/Input";
import { useFormValidation, fieldValidationRules } from "../hooks/useFormValidation";
import { FormErrors, FormField, SuccessMessage } from "../components/form/FormField";
import { useUiStore } from "../store/uiStore";
import { t } from "../utils/i18n";

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
  const [updatingId, setUpdatingId] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { errors, touched, isSubmitting, setIsSubmitting, markFieldTouched, validateField, clearErrors, handleApiError } = useFormValidation();
  const language = useUiStore((state) => state.language);
  const text = (fr, en) => t(language, fr, en);

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
    clearErrors();
    setSuccessMessage("");
    markFieldTouched("title");
    markFieldTouched("recommendation");
    markFieldTouched("dueDate");

    const titleError = validateField(
      "title",
      form.title,
      fieldValidationRules.combine(
        fieldValidationRules.required,
        fieldValidationRules.minLength(5),
        fieldValidationRules.maxLength(200),
      ),
    );
    const recommendationError = validateField(
      "recommendation",
      form.recommendation,
      fieldValidationRules.maxLength(500),
    );
    const dueDateError = validateField(
      "dueDate",
      form.dueDate,
      fieldValidationRules.date,
    );

    if (titleError || recommendationError || dueDateError) {
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/corrective-actions", {
        title: form.title,
        recommendation: form.recommendation || null,
        severity: form.severity,
        source: form.source,
        nonConformityId: form.nonConformityId || null,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      });
      setForm(initialForm);
      setSuccessMessage(text("Action corrective creee avec succes !", "Corrective action created successfully!"));
      setTimeout(() => setSuccessMessage(""), 3000);
      await loadData();
    } catch (error) {
      if (error.response?.data?.fieldErrors) {
        handleApiError(error.response.data);
      } else {
        handleApiError({ message: getErrorMessage(error), fieldErrors: {} });
      }
    } finally {
      setIsSubmitting(false);
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
        title={text("Centre de commande CAPA", "CAPA Command Center")}
        subtitle={text("Planifier, prioriser et suivre les actions correctives/preventives avec les controles de fermeture ISO.", "Plan, prioritize, and track corrective/preventive actions with ISO closure controls.")}
      />

      {state.error ? <div className="saas-card p-4 text-rose-700">{state.error}</div> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{text("CAPA total", "Total CAPA")}</p>
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
            title={text("Portefeuille d'actions ouvert", "Open Action Portfolio")}
            subtitle={text("Actions triees par priorite pour la direction qualite et l'escalade.", "Priority-sorted actions for quality steering and escalation.")}
            action={<Badge tone="amber">{state.data.length}</Badge>}
          />

          <div className="mb-3 grid gap-2 md:grid-cols-3">
            <Select value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}>
              <option value="">{text("Tous les statuts", "All status")}</option>
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
          <CardHeader
            title={text("Creer une CAPA", "Create CAPA")}
            subtitle={text(
              "Enregistrer une action corrective/preventive liee a un evenement qualite.",
              "Register a corrective/preventive action linked to a quality event.",
            )}
          />
          <form className="space-y-2" onSubmit={handleCreate}>
            <SuccessMessage message={successMessage} onDismiss={() => setSuccessMessage("")} />
            <FormErrors errors={errors} />

            <FormField
              label={text("Titre de l'action", "Action Title")}
              name="title"
              type="text"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              onBlur={() => markFieldTouched("title")}
              error={errors.title}
              touched={touched.title}
              placeholder={text(
                "ex. Mettre en place une revue avant publication",
                "e.g. Implement second-level review before release",
              )}
              helpText={text("Minimum 5 caracteres", "Minimum 5 characters")}
              required
            />

            <FormField
              label={text("Recommandation", "Recommendation")}
              name="recommendation"
              type="textarea"
              value={form.recommendation}
              onChange={(event) => setForm((prev) => ({ ...prev, recommendation: event.target.value }))}
              onBlur={() => markFieldTouched("recommendation")}
              error={errors.recommendation}
              touched={touched.recommendation}
              placeholder={text(
                "Decrire les etapes, les attentes et les criteres de succes.",
                "State corrective action steps, owner expectations, and success criteria.",
              )}
              helpText={text("Max 500 caracteres", "Max 500 characters")}
            />

            <FormField
              label={text("Gravite", "Severity")}
              name="severity"
              type="select"
              value={form.severity}
              onChange={(event) => setForm((prev) => ({ ...prev, severity: event.target.value }))}
              onBlur={() => markFieldTouched("severity")}
              error={errors.severity}
              touched={touched.severity}
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </FormField>

            <FormField
              label={text("Source", "Source")}
              name="source"
              type="select"
              value={form.source}
              onChange={(event) => setForm((prev) => ({ ...prev, source: event.target.value }))}
              onBlur={() => markFieldTouched("source")}
              error={errors.source}
              touched={touched.source}
            >
              <option value="MANUAL">MANUAL</option>
              <option value="OVERDUE_TASK">OVERDUE_TASK</option>
              <option value="DELAYED_PROJECT">DELAYED_PROJECT</option>
              <option value="KPI_DEVIATION">KPI_DEVIATION</option>
            </FormField>

            <FormField
              label={text("Non-conformite liee", "Linked Non-Conformity")}
              name="nonConformityId"
              type="select"
              value={form.nonConformityId}
              onChange={(event) => setForm((prev) => ({ ...prev, nonConformityId: event.target.value }))}
              onBlur={() => markFieldTouched("nonConformityId")}
              error={errors.nonConformityId}
              touched={touched.nonConformityId}
              helpText={text("Lien optionnel", "Optional link")}
            >
              <option value="">{text("Selectionner une non-conformite (optionnel)", "Select non-conformity (optional)")}</option>
              {nonConformities.map((item) => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </FormField>

            <FormField
              label={text("Date limite", "Due Date")}
              name="dueDate"
              type="date"
              value={form.dueDate}
              onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
              onBlur={() => markFieldTouched("dueDate")}
              error={errors.dueDate}
              touched={touched.dueDate}
              helpText={text(
                "Fixer une date realiste en fonction de la gravite.",
                "Set a realistic completion date aligned with risk severity.",
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? text("Enregistrement...", "Saving...") : text("Creer l'action corrective", "Create Corrective Action")}
            </Button>
          </form>
        </Card>
      </section>
    </div>
  );
}
