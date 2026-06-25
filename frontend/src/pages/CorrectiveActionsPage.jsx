import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
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

function getDueStatus(dueDate) {
  if (!dueDate) return null;
  const daysRemaining = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
  if (daysRemaining < 0) return "overdue";
  if (daysRemaining <= 3) return "warning";
  return null;
}

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
      const [actionResp, ncResp] = await Promise.all([
        api.get("/corrective-actions", { params: queryParams }),
        api.get("/non-conformities"),
      ]);

      setState({ loading: false, data: actionResp.data?.data || actionResp.data || [], error: "" });
      setNonConformities(ncResp.data?.data || ncResp.data || []);
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

  const getFutureDate = (daysFromNow) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().slice(0, 10);
  };

  const capaTemplates = {
    rootCause: {
      title: text("Realiser une analyse cause racine", "Perform root-cause analysis"),
      recommendation: text(
        "Organiser une analyse 5 pourquoi, confirmer la cause avec les preuves disponibles et documenter les actions retenues.",
        "Run a 5-why analysis, confirm the cause with available evidence, and document the selected actions.",
      ),
      severity: "HIGH",
      source: "MANUAL",
      dueInDays: 7,
    },
    containment: {
      title: text("Mettre en place une action de confinement", "Implement containment action"),
      recommendation: text(
        "Isoler les elements impactes, informer les responsables et definir les controles temporaires.",
        "Isolate affected items, inform responsible owners, and define temporary controls.",
      ),
      severity: "CRITICAL",
      source: "MANUAL",
      dueInDays: 3,
    },
    kpi: {
      title: text("Corriger un KPI sous objectif", "Correct under-target KPI"),
      recommendation: text(
        "Analyser les causes de sous-performance, ajuster le plan d'action et verifier le resultat au prochain cycle.",
        "Analyze underperformance causes, adjust the action plan, and verify results in the next cycle.",
      ),
      severity: "MEDIUM",
      source: "KPI_DEVIATION",
      dueInDays: 14,
    },
    overdueTask: {
      title: text("Replanifier une tache en retard", "Reschedule overdue task"),
      recommendation: text(
        "Revoir la charge, confirmer le responsable et definir une nouvelle date de cloture controlee.",
        "Review workload, confirm ownership, and define a controlled closure date.",
      ),
      severity: "MEDIUM",
      source: "OVERDUE_TASK",
      dueInDays: 5,
    },
    effectiveness: {
      title: text("Verifier l'efficacite de l'action", "Verify action effectiveness"),
      recommendation: text(
        "Definir les criteres de verification, collecter les preuves et statuer sur l'efficacite.",
        "Define verification criteria, collect evidence, and decide whether the action is effective.",
      ),
      severity: "LOW",
      source: "MANUAL",
      dueInDays: 21,
    },
  };

  const applyCapaTemplate = (templateKey) => {
    const template = capaTemplates[templateKey];
    if (!template) {
      setForm(initialForm);
      return;
    }

    setForm((prev) => ({
      ...prev,
      title: template.title,
      recommendation: template.recommendation,
      severity: template.severity,
      source: template.source,
      dueDate: getFutureDate(template.dueInDays),
    }));
  };

  const sourceLabels = {
    MANUAL: text("Manuel", "Manual"),
    OVERDUE_TASK: text("Tache en retard", "Overdue task"),
    DELAYED_PROJECT: text("Projet en retard", "Delayed project"),
    KPI_DEVIATION: text("Ecart KPI", "KPI deviation"),
  };

  const actionTypeLabels = {
    CORRECTIVE: text("Corrective", "Corrective"),
    PREVENTIVE: text("Preventive", "Preventive"),
  };

  const totals = useMemo(() => {
    const list = state.data || [];
    return {
      total: list.length,
      open: list.filter((item) => item.status === "OPEN").length,
      inProgress: list.filter((item) => item.status === "IN_PROGRESS").length,
      critical: list.filter((item) => item.severity === "CRITICAL").length,
      pendingVerification: list.filter((item) => item.effectivenessStatus !== "VERIFIED").length,
      corrective: list.filter((item) => item.actionType === "CORRECTIVE").length,
      preventive: list.filter((item) => item.actionType === "PREVENTIVE").length,
      overdue: list.filter((item) => item.dueDate && new Date(item.dueDate) < new Date() && item.status !== "DONE").length,
    };
  }, [state.data]);

  const chartData = useMemo(() => {
    const list = state.data || [];
    const severityMap = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    const statusMap = { OPEN: 0, IN_PROGRESS: 0, DONE: 0, CANCELLED: 0 };
    const sourceMap = { MANUAL: 0, OVERDUE_TASK: 0, DELAYED_PROJECT: 0, KPI_DEVIATION: 0 };
    const actionTypeMap = { CORRECTIVE: 0, PREVENTIVE: 0 };

    list.forEach((item) => {
      if (severityMap.hasOwnProperty(item.severity)) severityMap[item.severity]++;
      if (statusMap.hasOwnProperty(item.status)) statusMap[item.status]++;
      if (sourceMap.hasOwnProperty(item.source)) sourceMap[item.source]++;
      if (actionTypeMap.hasOwnProperty(item.actionType)) actionTypeMap[item.actionType]++;
    });

    const severityData = Object.entries(severityMap).map(([name, value]) => ({ name, value }));
    const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));
    const sourceData = Object.entries(sourceMap).map(([name, value]) => ({ name, value }));
    const actionTypeData = Object.entries(actionTypeMap).map(([name, value]) => ({ name, value }));

    return { severityData, statusData, sourceData, actionTypeData };
  }, [state.data]);

  const chartColors = {
    CRITICAL: "#ef4444",
    HIGH: "#f97316",
    MEDIUM: "#3b82f6",
    LOW: "#22c55e",
    OPEN: "#eab308",
    IN_PROGRESS: "#3b82f6",
    DONE: "#22c55e",
    CANCELLED: "#94a3b8",
    CORRECTIVE: "#8b5cf6",
    PREVENTIVE: "#06b6d4",
    MANUAL: "#6366f1",
    OVERDUE_TASK: "#f97316",
    DELAYED_PROJECT: "#ef4444",
    KPI_DEVIATION: "#eab308",
  };

  const MetricCard = ({ label, value, colorClass = "text-slate-900" }) => (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${colorClass}`}>{value}</p>
    </div>
  );

  const SimpleTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <p className="text-xs font-semibold text-slate-900">{label}: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={text("Actions CAPA", "CAPA actions")}
        subtitle={text("Suivre les actions correctives et preventives.", "Track corrective and preventive actions.")}
      />

      {state.error ? <div className="saas-card p-4 text-rose-700">{state.error}</div> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label={text("Total", "Total")} value={totals.total} />
        <MetricCard label={text("En cours", "In progress")} value={totals.inProgress} colorClass="text-sky-700" />
        <MetricCard label={text("Critiques", "Critical")} value={totals.critical} colorClass="text-rose-700" />
        <MetricCard label={text("En retard", "Overdue")} value={totals.overdue} colorClass="text-amber-700" />
      </div>

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <CardHeader title={text("Gravite", "Severity")} subtitle={text("Repartition par gravite.", "Distribution by severity.")} />
          <div className="mt-3 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData.severityData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70}>
                  {chartData.severityData.map((entry) => (
                    <Cell key={entry.name} fill={chartColors[entry.name] || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip content={<SimpleTooltip />} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <CardHeader title={text("Statut", "Status")} subtitle={text("Repartition par statut.", "Distribution by status.")} />
          <div className="mt-3 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.statusData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                <Tooltip content={<SimpleTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {chartData.statusData.map((entry) => (
                    <Cell key={entry.name} fill={chartColors[entry.name] || "#94a3b8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <CardHeader title={text("Type", "Action Type")} subtitle={text("Correctives vs preventives.", "Corrective vs preventive.")} />
          <div className="mt-3 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData.actionTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70}>
                  {chartData.actionTypeData.map((entry) => (
                    <Cell key={entry.name} fill={chartColors[entry.name] || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip content={<SimpleTooltip />} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <CardHeader title={text("Source", "Source")} subtitle={text("Provenance des actions.", "Source of actions.")} />
          <div className="mt-3 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.sourceData}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<SimpleTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.sourceData.map((entry) => (
                    <Cell key={entry.name} fill={chartColors[entry.name] || "#94a3b8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="p-5">
          <CardHeader
            title={text("Actions ouvertes", "Open actions")}
            subtitle={text("Liste filtree par statut, severite, type et source.", "List filtered by status, severity, type, and source.")}
            action={<Badge tone="blue">{state.data.length}</Badge>}
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
              {state.data.map((item) => {
                const dueStatus = getDueStatus(item.dueDate);
                const isOverdue = dueStatus === "overdue";
                const isWarning = dueStatus === "warning";

                const statusColor = item.status === "DONE" ? "green" : item.status === "IN_PROGRESS" ? "sky" : item.status === "CANCELLED" ? "slate" : "amber";

                return (
                  <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                          <Badge tone="purple">{actionTypeLabels[item.actionType]}</Badge>
                          <Badge tone={item.severity === "CRITICAL" ? "red" : item.severity === "HIGH" ? "amber" : item.severity === "MEDIUM" ? "blue" : "green"}>
                            {item.severity}
                          </Badge>
                          <Badge tone={statusColor}>{item.status}</Badge>
                          {isOverdue && <Badge tone="red" className="text-xs">{'>'} {text("Fut" , "late")}</Badge>}
                          {isWarning && <Badge tone="amber" className="text-xs">{'<'} 3 {text("jours restants", "days left")}</Badge>}
                        </div>
                        {item.source && (
                          <p className="text-xs font-medium text-slate-600 mb-1">
                            {text("Source", "Source")}: {sourceLabels[item.source]}
                          </p>
                        )}
                        {item.dueDate && (
                          <p className="text-xs font-medium mb-1">
                            {text("Date limite", "Due date")}: {new Date(item.dueDate).toLocaleDateString()}{' '}
                            {isOverdue && <span className="text-rose-600 font-semibold">{''}{text("expire", "expired")}</span>}
                          </p>
                        )}
                        {(item.processName || item.projectName) && (
                          <p className="text-xs text-slate-500 mb-1">
                            {item.processName && <span>{item.processName}</span>}
                            {item.processName && item.projectName && ' • '}
                            {item.projectName && <span>{item.projectName}</span>}
                          </p>
                        )}
                        {item.isoClause && (
                          <p className="text-xs text-slate-500">
                            {text("Clause ISO", "ISO clause")}: {item.isoClause}
                          </p>
                        )}
                      </div>
                      {item.nonConformity?.title && (
                        <Badge tone="slate" className="text-xs">
                          NC: {item.nonConformity.title}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.status === "OPEN" ? (
                        <Button
                          variant="subtle"
                          className="text-xs"
                          onClick={() => quickStatusUpdate(item.id, "IN_PROGRESS")}
                          disabled={updatingId === item.id}
                        >
                          {text("Demarrer l'action", "Start action")}
                        </Button>
                      ) : null}
                      {item.status !== "CANCELLED" && item.status !== "DONE" ? (
                        <Button
                          variant="subtle"
                          className="text-xs"
                          onClick={() => quickStatusUpdate(item.id, "CANCELLED")}
                          disabled={updatingId === item.id}
                        >
                          {text("Annuler", "Cancel")}
                        </Button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
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
          <div className="mb-3 flex flex-wrap gap-2">
            <Button type="button" variant="subtle" className="px-3 py-1.5 text-xs" onClick={() => applyCapaTemplate("rootCause")}>
              {text("Modele cause", "Cause template")}
            </Button>
            <Button type="button" variant="subtle" className="px-3 py-1.5 text-xs" onClick={() => applyCapaTemplate("containment")}>
              {text("Modele confinement", "Containment template")}
            </Button>
            <Button type="button" variant="subtle" className="px-3 py-1.5 text-xs" onClick={() => applyCapaTemplate("kpi")}>
              {text("Modele KPI", "KPI template")}
            </Button>
            <Button type="button" variant="subtle" className="px-3 py-1.5 text-xs" onClick={() => applyCapaTemplate("overdueTask")}>
              {text("Modele retard", "Overdue template")}
            </Button>
            <Button type="button" variant="subtle" className="px-3 py-1.5 text-xs" onClick={() => applyCapaTemplate("effectiveness")}>
              {text("Modele efficacite", "Effectiveness template")}
            </Button>
            <Button type="button" variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => applyCapaTemplate("reset")}>
              {text("Reinitialiser", "Reset")}
            </Button>
          </div>
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