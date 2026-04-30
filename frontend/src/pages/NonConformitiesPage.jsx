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
  description: "",
  severity: "MEDIUM",
  processId: "",
};

export default function NonConformitiesPage() {
  const [state, setState] = useState({ loading: true, data: [], error: "" });
  const [processes, setProcesses] = useState([]);
  const [filters, setFilters] = useState({ status: "", severity: "" });
  const [form, setForm] = useState(initialForm);
  const [updatingId, setUpdatingId] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { errors, touched, isSubmitting, setIsSubmitting, markFieldTouched, validateField, clearErrors, handleApiError } = useFormValidation();
  const language = useUiStore((state) => state.language);
  const text = (fr, en) => t(language, fr, en);

  const ncTemplates = {
    calibration: {
      title: text("Absence de preuve d'etalonnage", "Missing calibration evidence"),
      description: text(
        "Aucun certificat d'etalonnage pour l'equipement controle. Verifier l'historique et la tracabilite.",
        "No calibration certificate for the controlled equipment. Check history and traceability.",
      ),
      severity: "HIGH",
    },
    audit: {
      title: text("Ecart detecte lors d'audit interne", "Internal audit deviation detected"),
      description: text(
        "Non-conformite identifiee durant l'audit interne. Preciser le processus impacte et les preuves.",
        "Non-conformity detected during internal audit. Specify the impacted process and evidence.",
      ),
      severity: "MEDIUM",
    },
    delivery: {
      title: text("Retard de livraison critique", "Critical delivery delay"),
      description: text(
        "Livraison non conforme aux delais contractuels avec impact client. Joindre la preuve de retard.",
        "Delivery not compliant with contractual timelines with customer impact. Attach delay evidence.",
      ),
      severity: "CRITICAL",
    },
  };

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
    clearErrors();
    setSuccessMessage("");
    markFieldTouched("title");
    markFieldTouched("description");
    markFieldTouched("severity");

    const titleError = validateField(
      "title",
      form.title,
      fieldValidationRules.combine(
        fieldValidationRules.required,
        fieldValidationRules.minLength(5),
        fieldValidationRules.maxLength(200),
      ),
    );
    const descriptionError = validateField(
      "description",
      form.description,
      fieldValidationRules.combine(
        fieldValidationRules.minLength(10),
        fieldValidationRules.maxLength(1000),
      ),
    );

    if (titleError || descriptionError) {
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/non-conformities", {
        title: form.title,
        description: form.description || null,
        severity: form.severity,
        processId: form.processId || null,
      });
      setForm(initialForm);
      setSuccessMessage(text("Non-conformite creee avec succes !", "Non-conformity created successfully!"));
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

  const applyNcTemplate = (templateKey) => {
    const template = ncTemplates[templateKey];
    if (!template) {
      setForm(initialForm);
      return;
    }

    setForm((prev) => ({
      ...prev,
      title: template.title,
      description: template.description,
      severity: template.severity,
    }));
  };

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
        title={text("Registre de controle des non-conformites", "Non-Conformity Control Register")}
        subtitle={text("Registre central pour les ecarts de qualite, le suivi des causes profondes et la liaison CAPA.", "Central register for quality deviations, root-cause tracking, and CAPA linkage.")}
      />

      {state.error ? <div className="saas-card p-4 text-rose-700">{state.error}</div> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{text("NC total", "Total NC")}</p>
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
            title={text("Registre ouvert", "Open Register")}
            subtitle={text("Vue de gouvernance des ecarts par severite et statut du cycle de vie.", "Governance view of deviations by severity and lifecycle status.")}
            action={<Badge tone="amber">{state.data.length}</Badge>}
          />

          <div className="mb-3 grid gap-2 sm:grid-cols-2">
            <Select value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}>
              <option value="">{text("Tous les statuts", "All statuses")}</option>
              <option value="OPEN">OPEN</option>
              <option value="ANALYSIS">ANALYSIS</option>
              <option value="CLOSED">CLOSED</option>
            </Select>
            <Select value={filters.severity} onChange={(event) => setFilters((prev) => ({ ...prev, severity: event.target.value }))}>
              <option value="">{text("Tous les niveaux de severite", "All severities")}</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </Select>
          </div>

          {state.loading ? (
            <p className="text-sm text-slate-500">{text("Chargement des non-conformites...", "Loading non-conformities...")}</p>
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
          <CardHeader
            title={text("Declarer une non-conformite", "Declare Non-Conformity")}
            subtitle={text(
              "Capturer les ecarts pour declencher des actions correctives.",
              "Capture deviation evidence to trigger controlled corrective actions.",
            )}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="subtle" className="px-3 py-1.5 text-xs" onClick={() => applyNcTemplate("calibration")}>
              {text("Modele etalonnage", "Calibration template")}
            </Button>
            <Button type="button" variant="subtle" className="px-3 py-1.5 text-xs" onClick={() => applyNcTemplate("audit")}>
              {text("Modele audit interne", "Internal audit template")}
            </Button>
            <Button type="button" variant="subtle" className="px-3 py-1.5 text-xs" onClick={() => applyNcTemplate("delivery")}>
              {text("Modele retard critique", "Critical delay template")}
            </Button>
            <Button type="button" variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => applyNcTemplate("reset")}>
              {text("Reinitialiser", "Reset")}
            </Button>
          </div>
          <form className="space-y-2" onSubmit={handleCreate}>
            <SuccessMessage message={successMessage} onDismiss={() => setSuccessMessage("")} />
            <FormErrors errors={errors} />

            <FormField
              label={text("Titre de la non-conformite", "Non-Conformity Title")}
              name="title"
              type="text"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              onBlur={() => markFieldTouched("title")}
              error={errors.title}
              touched={touched.title}
              placeholder={text("ex. Absence de preuve d'etalonnage", "e.g. Calibration record missing for lab equipment")}
              helpText={text("Minimum 5 caracteres", "Minimum 5 characters")}
              required
            />

            <FormField
              label={text("Description et preuves", "Description and Evidence")}
              name="description"
              type="textarea"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              onBlur={() => markFieldTouched("description")}
              error={errors.description}
              touched={touched.description}
              placeholder={text(
                "Decrire l'ecart, le lieu de detection et les preuves disponibles.",
                "Describe what happened, where it was detected, and available evidence.",
              )}
              helpText={text("Min 10 caracteres si renseigne, max 1000", "Min 10 characters if provided, max 1000")}
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
              label={text("Processus associe", "Related Process")}
              name="processId"
              type="select"
              value={form.processId}
              onChange={(event) => setForm((prev) => ({ ...prev, processId: event.target.value }))}
              onBlur={() => markFieldTouched("processId")}
              error={errors.processId}
              touched={touched.processId}
              helpText={text("Lien optionnel", "Optional link")}
            >
              <option value="">{text("Selectionner un processus (optionnel)", "Select process (optional)")}</option>
              {processes.map((process) => (
                <option key={process.id} value={process.id}>{process.name}</option>
              ))}
            </FormField>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? text("Enregistrement...", "Saving...") : text("Creer la non-conformite", "Create Non-Conformity")}
            </Button>
          </form>
        </Card>
      </section>
    </div>
  );
}
