import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import PageHeader from "../components/ui/PageHeader";
import { getErrorMessage } from "../utils/http";
import { Card, CardHeader } from "../components/ui/Card";
import { Input, TextArea } from "../components/ui/Input";
import Button from "../components/ui/Button";
import { Table } from "../components/ui/Table";
import ProjectProgress from "../components/projects/ProjectProgress";
import StatusBadge from "../components/ui/StatusBadge";
import { useFormValidation, fieldValidationRules } from "../hooks/useFormValidation";
import { FormField, FormErrors, SuccessMessage } from "../components/form/FormField";
import { useUiStore } from "../store/uiStore";
import { t } from "../utils/i18n";

const initialForm = {
  name: "",
  description: "",
  responsiblePerson: "",
  inputs: "",
  outputs: "",
  indicators: "",
};

function parseListInput(value) {
  return value
    .split(/[;,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseIndicatorsInput(raw) {
  const value = raw.trim();
  if (!value) return [];

  if (value.startsWith("[")) {
    return JSON.parse(value);
  }

  // Support simple comma/semicolon/newline-separated KPI names for faster entry.
  return parseListInput(value).map((name) => ({
    name,
    target: 100,
    current: 0,
  }));
}

export default function ProcessesPage() {
  const [processes, setProcesses] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [successMessage, setSuccessMessage] = useState("");
  const { errors, touched, isSubmitting, setIsSubmitting, markFieldTouched, handleApiError, clearErrors, hasErrors } = useFormValidation();
  const language = useUiStore((state) => state.language);
  const text = (fr, en) => t(language, fr, en);

  const loadProcesses = async () => {
    try {
      const [processRes, tasksRes] = await Promise.all([api.get("/processes"), api.get("/tasks")]);
      setProcesses(processRes.data.data);
      setTasks(tasksRes.data.data || []);
    } catch (err) {
      handleApiError({ message: getErrorMessage(err), fieldErrors: {} });
    }
  };

  useEffect(() => {
    loadProcesses();
  }, []);

  const totalTasks = useMemo(
    () => processes.reduce((sum, process) => sum + (process?._count?.tasks || 0), 0),
    [processes],
  );

  const onSubmit = async (event) => {
    event.preventDefault();
    clearErrors();
    setSuccessMessage("");

    try {
      const payload = {
        name: form.name,
        description: form.description,
        responsiblePerson: form.responsiblePerson,
        inputs: parseListInput(form.inputs),
        outputs: parseListInput(form.outputs),
        indicators: parseIndicatorsInput(form.indicators),
      };

      setIsSubmitting(true);
      await api.post("/processes", payload);
      setForm(initialForm);
      setSuccessMessage(text("Processus cree avec succes!", "Process created successfully!"));
      setTimeout(() => setSuccessMessage(""), 3000);
      loadProcesses();
    } catch (err) {
      if (err.response?.data?.fieldErrors) {
        handleApiError(err.response.data);
      } else if (err instanceof SyntaxError) {
        handleApiError({ message: "Format des indicateurs invalide. Utilisez json ou une liste simple (taux de clôture, livraison à temps)", fieldErrors: { indicators: "Format invalide" } });
      } else {
        handleApiError({ message: getErrorMessage(err), fieldErrors: {} });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyProcessTemplate = (template) => {
    if (template === "procurement") {
      setForm({
        name: text("Controle des achats", "Procurement Control"),
        description: text(
          "Controler la selection fournisseur, la validation des achats et la reception.",
          "Control supplier selection, purchase validation, and reception acceptance criteria.",
        ),
        responsiblePerson: text("Responsable qualite", "Quality Manager"),
        inputs: text("Demande d'achat, Specification, Budget", "Purchase request, Specification, Budget"),
        outputs: text("Commande approuvee, Bon de livraison, Rapport d'acceptation", "Approved order, Delivery record, Acceptance report"),
        indicators: text("Livraison a temps, Taux de conformite fournisseur", "On-time delivery, Supplier conformity rate"),
      });
      return;
    }

    if (template === "audit") {
      setForm({
        name: text("Processus d'audit interne", "Internal Audit Process"),
        description: text(
          "Planifier les audits internes, consolider les constats et suivre les actions.",
          "Plan and execute internal audits, consolidate findings, and monitor action closure.",
        ),
        responsiblePerson: "CAQ",
        inputs: text("Plan d'audit, Constats precedents, Documentation processus", "Audit plan, Previous findings, Process documentation"),
        outputs: text("Rapport d'audit, Registre NC, Demandes CAPA", "Audit report, Non-conformity log, CAPA requests"),
        indicators: text("Taux de realisation des audits, Taux de cloture des constats", "Audit completion rate, Finding closure rate"),
      });
      return;
    }

    setForm(initialForm);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={text("Architecture des processus", "Process Architecture")}
        subtitle={text(`Carte de processus gouvernee avec ${totalTasks} taches d'execution liees.`, `Governed process map with ${totalTasks} linked execution tasks.`)}
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <Card className="p-0 overflow-hidden">
          <div className="px-5 pt-5">
            <CardHeader title={text("Bibliothèque des processus", "Process Library")} subtitle={text("Proprietaire, charge de travail et acces au detail.", "Owner, workload and drill-down access.")} />
          </div>
          <Table headers={["Name", "Responsible", "Tasks", "Progress", "Status", "Related Tasks", "Action"]}>
            {processes.map((process) => (
              <tr key={process.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{process.name}</td>
                <td className="px-4 py-3 text-slate-600">{process.responsiblePerson}</td>
                <td className="px-4 py-3 text-slate-600">{process?._count?.tasks || 0}</td>
                <td className="px-4 py-3 text-slate-600">
                  <ProjectProgress
                    progress={process.progress || 0}
                    status={process.computedStatus || "On Track"}
                    completedTasks={process.completedTasks || 0}
                    totalTasks={process.totalTasks || 0}
                  />
                </td>
                <td className="px-4 py-3 text-slate-600">
                  <StatusBadge status={process.computedStatus || "On Track"} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {tasks
                      .filter((task) => task.processId === process.id)
                      .slice(0, 3)
                      .map((task) => (
                        <span key={task.id} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                          {task.title}
                        </span>
                      ))}
                    {tasks.filter((task) => task.processId === process.id).length > 3 ? (
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                        +{tasks.filter((task) => task.processId === process.id).length - 3} more
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link className="text-sm font-medium text-emerald-700 hover:text-emerald-800" to={`/processes/${process.id}`}>
                      Open
                    </Link>
                    <Link className="text-sm font-medium text-slate-700 hover:text-slate-900" to={`/tasks?processId=${process.id}`}>
                      View tasks
                    </Link>
                    <Link className="text-sm font-medium text-slate-700 hover:text-slate-900" to={`/tasks?processId=${process.id}&quickAssign=1`}>
                      Quick assign
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </Card>

        <Card className="p-5">
          <CardHeader title={text("Creer un processus", "Create Process")} subtitle={text("Ajouter une definition ISO controlee.", "Add a controlled ISO process definition.")} />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="subtle" className="px-3 py-1.5 text-xs" onClick={() => applyProcessTemplate("procurement")}>
              {text("Modele achats", "Use Procurement Template")}
            </Button>
            <Button type="button" variant="subtle" className="px-3 py-1.5 text-xs" onClick={() => applyProcessTemplate("audit")}>
              {text("Modele audit", "Use Audit Template")}
            </Button>
            <Button type="button" variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => applyProcessTemplate("reset")}>
              {text("Reinitialiser", "Reset")}
            </Button>
          </div>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            {text(
              "Les indicateurs acceptent un tableau JSON ou une liste simple (virgule, point-virgule, ligne).",
              "Indicators accept JSON array or plain list (comma, semicolon, or line-separated).",
            )}
          </p>
          <form className="mt-3 space-y-3" onSubmit={onSubmit}>
            <SuccessMessage message={successMessage} onDismiss={() => setSuccessMessage("")} />
            <FormErrors errors={errors} />

            <FormField
              label={text("Nom du processus", "Process Name")}
              name="name"
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              onBlur={() => markFieldTouched("name")}
              error={errors.name}
              touched={touched.name}
              placeholder={text("ex. Controle des achats", "e.g. Procurement Control")}
              helpText={text("Minimum 2 caracteres", "Name must be at least 2 characters")}
              required
            />

            <FormField
              label={text("Responsable", "Responsible Person")}
              name="responsiblePerson"
              type="text"
              value={form.responsiblePerson}
              onChange={(e) => setForm((p) => ({ ...p, responsiblePerson: e.target.value }))}
              onBlur={() => markFieldTouched("responsiblePerson")}
              error={errors.responsiblePerson}
              touched={touched.responsiblePerson}
              placeholder={text("ex. Responsable qualite", "e.g. Quality Manager")}
              required
            />

            <FormField
              label={text("Description", "Description")}
              name="description"
              type="textarea"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              onBlur={() => markFieldTouched("description")}
              error={errors.description}
              touched={touched.description}
              placeholder={text("Decrire le perimetre, les controles et les resultats.", "Describe scope, controls, and expected outcomes.")}
              helpText={text("Max 500 caracteres", "Max 500 characters")}
            />

            <FormField
              label={text("Entrees", "Inputs")}
              name="inputs"
              type="text"
              value={form.inputs}
              onChange={(e) => setForm((p) => ({ ...p, inputs: e.target.value }))}
              onBlur={() => markFieldTouched("inputs")}
              error={errors.inputs}
              touched={touched.inputs}
              placeholder={text("ex. Demande, Specification, Budget", "e.g. Request, Specification, Budget")}
            />

            <FormField
              label={text("Sorties", "Outputs")}
              name="outputs"
              type="text"
              value={form.outputs}
              onChange={(e) => setForm((p) => ({ ...p, outputs: e.target.value }))}
              onBlur={() => markFieldTouched("outputs")}
              error={errors.outputs}
              touched={touched.outputs}
              placeholder={text("ex. Commande, Livraison, Rapport", "e.g. Approved order, Delivery, Acceptance report")}
            />

            <FormField
              label={text("Indicateurs KPI", "KPI Indicators")}
              name="indicators"
              type="textarea"
              value={form.indicators}
              onChange={(e) => setForm((p) => ({ ...p, indicators: e.target.value }))}
              onBlur={() => markFieldTouched("indicators")}
              error={errors.indicators}
              touched={touched.indicators}
              placeholder={text("ex. Taux de cloture, Livraison a temps", "e.g. Closure rate, On-time delivery")}
              helpText={text(
                "Si vous saisissez des noms simples, les valeurs par defaut sont creees (cible 100, actuel 0).",
                "If you type plain KPI names, defaults are auto-created (target 100, current 0).",
              )}
            />

            <Button className="w-full" disabled={isSubmitting}>
              {isSubmitting ? text("Enregistrement...", "Saving...") : text("Enregistrer le processus", "Save Process")}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
