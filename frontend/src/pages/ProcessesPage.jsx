import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import PageHeader from "../components/ui/PageHeader";
import { getErrorMessage } from "../utils/http";
import { Card, CardHeader } from "../components/ui/Card";
import { Select } from "../components/ui/Input";
import Button from "../components/ui/Button";
import { Table } from "../components/ui/Table";
import ProjectProgress from "../components/projects/ProjectProgress";
import StatusBadge from "../components/ui/StatusBadge";
import { useFormValidation } from "../hooks/useFormValidation";
import { FormField, FormErrors, SuccessMessage } from "../components/form/FormField";
import { useUiStore } from "../store/uiStore";
import { useAuthStore } from "../store/authStore";
import { t } from "../utils/i18n";

const initialForm = {
  name: "",
  description: "",
  responsiblePerson: "",
  departmentId: "",
  inputs: "",
  outputs: "",
  indicators: "",
};

function parseListInput(value) {
  return value.split(/[;,\n]/).map((item) => item.trim()).filter(Boolean);
}

function parseIndicatorsInput(raw) {
  const value = raw.trim();
  if (!value) return [];
  if (value.startsWith("[")) return JSON.parse(value);
  return parseListInput(value).map((name) => ({ name, target: 100, current: 0 }));
}

export default function ProcessesPage() {
  const [processes, setProcesses] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [departmentName, setDepartmentName] = useState("");
  const [form, setForm] = useState(initialForm);
  const [successMessage, setSuccessMessage] = useState("");
  const { errors, touched, isSubmitting, setIsSubmitting, markFieldTouched, handleApiError, clearErrors } = useFormValidation();
  const language = useUiStore((state) => state.language);
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN";
  const text = useCallback((fr, en) => t(language, fr, en), [language]);

  const loadProcesses = useCallback(async () => {
    try {
      const [processRes, tasksRes, departmentRes] = await Promise.all([
        api.get("/processes"),
        api.get("/tasks"),
        api.get("/processes/departments"),
      ]);
      setProcesses(processRes.data.data || []);
      setTasks(tasksRes.data.data || []);
      setDepartments(departmentRes.data.data || []);
    } catch (err) {
      handleApiError({ message: getErrorMessage(err), fieldErrors: {} });
    }
  }, [handleApiError]);

  useEffect(() => {
    loadProcesses();
  }, [loadProcesses]);

  const totalTasks = useMemo(
    () => processes.reduce((sum, process) => sum + (process?._count?.tasks || 0), 0),
    [processes],
  );

  const groupedProcesses = useMemo(() => {
    const groups = new Map();
    for (const department of departments) {
      groups.set(department.id, { department, rows: [] });
    }
    for (const process of processes) {
      const key = process.department?.id || "unclassified";
      if (!groups.has(key)) {
        groups.set(key, {
          department: process.department || { id: "unclassified", name: text("Sans departement", "Unclassified") },
          rows: [],
        });
      }
      groups.get(key).rows.push(process);
    }
    return [...groups.values()].filter((group) => group.rows.length || group.department.id !== "unclassified");
  }, [processes, departments, text]);

  const onSubmit = async (event) => {
    event.preventDefault();
    clearErrors();
    setSuccessMessage("");

    try {
      setIsSubmitting(true);
      await api.post("/processes", {
        name: form.name,
        description: form.description,
        departmentId: form.departmentId || null,
        responsiblePerson: form.responsiblePerson,
        inputs: parseListInput(form.inputs),
        outputs: parseListInput(form.outputs),
        indicators: parseIndicatorsInput(form.indicators),
      });
      setForm(initialForm);
      setSuccessMessage(text("Processus cree avec succes.", "Process created successfully."));
      setTimeout(() => setSuccessMessage(""), 3000);
      await loadProcesses();
    } catch (err) {
      if (err.response?.data?.fieldErrors) {
        handleApiError(err.response.data);
      } else if (err instanceof SyntaxError) {
        handleApiError({ message: text("Format des indicateurs invalide.", "Invalid indicator format."), fieldErrors: { indicators: "Invalid format" } });
      } else {
        handleApiError({ message: getErrorMessage(err), fieldErrors: {} });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const createDepartment = async (event) => {
    event.preventDefault();
    if (!departmentName.trim()) return;

    try {
      const { data } = await api.post("/processes/departments", { name: departmentName });
      setDepartments((prev) => [...prev, data.data].sort((a, b) => a.name.localeCompare(b.name)));
      setDepartmentName("");
      setSuccessMessage(text("Departement ajoute.", "Department added."));
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      handleApiError({ message: getErrorMessage(err), fieldErrors: {} });
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={text("Architecture des processus", "Process Architecture")}
        subtitle={text(
          `Classement par departement avec ${totalTasks} taches d'execution liees.`,
          `Department grouped process map with ${totalTasks} linked execution tasks.`,
        )}
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <Card className="overflow-hidden p-0">
          <div className="px-5 pt-5">
            <CardHeader
              title={text("Processus par departement", "Processes by Department")}
              subtitle={text("DPGR, DG, Labo, DE et departements ajoutes.", "DPGR, DG, Labo, DE, and added departments.")}
            />
          </div>
          <div className="space-y-4 p-4">
            {groupedProcesses.map((group) => (
              <section key={group.department.id} className="rounded-lg border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
                  <p className="font-semibold text-slate-900">{group.department.name}</p>
                  <span className="text-xs text-slate-500">{group.rows.length} {text("processus", "processes")}</span>
                </div>
                <Table headers={["Name", "Responsible", "Tasks", "Progress", "Status", "Related Tasks", "Action"]}>
                  {group.rows.map((process) => (
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
                          {tasks.filter((task) => task.processId === process.id).slice(0, 3).map((task) => (
                            <span key={task.id} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                              {task.title}
                            </span>
                          ))}
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </Table>
              </section>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <CardHeader title={text("Creer un processus", "Create Process")} subtitle={text("Ajouter une definition ISO controlee.", "Add a controlled ISO process definition.")} />
          <form className="mt-3 space-y-3" onSubmit={onSubmit}>
            <SuccessMessage message={successMessage} onDismiss={() => setSuccessMessage("")} />
            <FormErrors errors={errors} />

            <FormField
              label={text("Nom du processus", "Process Name")}
              name="name"
              type="text"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              onBlur={() => markFieldTouched("name")}
              error={errors.name}
              touched={touched.name}
              required
            />

            <FormField
              label={text("Responsable", "Responsible Person")}
              name="responsiblePerson"
              type="text"
              value={form.responsiblePerson}
              onChange={(event) => setForm((prev) => ({ ...prev, responsiblePerson: event.target.value }))}
              onBlur={() => markFieldTouched("responsiblePerson")}
              error={errors.responsiblePerson}
              touched={touched.responsiblePerson}
              required
            />

            <div className="field-group">
              <label className="field-label">{text("Departement", "Department")}</label>
              <Select value={form.departmentId} onChange={(event) => setForm((prev) => ({ ...prev, departmentId: event.target.value }))}>
                <option value="">{text("Sans departement", "Unclassified")}</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>{department.name}</option>
                ))}
              </Select>
            </div>

            <FormField
              label={text("Description", "Description")}
              name="description"
              type="textarea"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              onBlur={() => markFieldTouched("description")}
              error={errors.description}
              touched={touched.description}
            />

            <FormField label={text("Entrees", "Inputs")} name="inputs" type="text" value={form.inputs} onChange={(event) => setForm((prev) => ({ ...prev, inputs: event.target.value }))} />
            <FormField label={text("Sorties", "Outputs")} name="outputs" type="text" value={form.outputs} onChange={(event) => setForm((prev) => ({ ...prev, outputs: event.target.value }))} />
            <FormField
              label={text("Indicateurs KPI", "KPI Indicators")}
              name="indicators"
              type="textarea"
              value={form.indicators}
              onChange={(event) => setForm((prev) => ({ ...prev, indicators: event.target.value }))}
              helpText={text("Liste simple ou tableau JSON.", "Plain list or JSON array.")}
            />

            <Button className="w-full" disabled={isSubmitting}>
              {isSubmitting ? text("Enregistrement...", "Saving...") : text("Enregistrer le processus", "Save Process")}
            </Button>
          </form>

          {isAdmin ? (
            <form className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-3" onSubmit={createDepartment}>
              <p className="text-sm font-semibold text-slate-900">{text("Ajouter un departement", "Add Department")}</p>
              <div className="mt-2 flex gap-2">
                <input
                  className="saas-input"
                  value={departmentName}
                  onChange={(event) => setDepartmentName(event.target.value)}
                  placeholder={text("ex. Scolarite", "e.g. Academic Affairs")}
                />
                <Button type="submit" className="shrink-0">{text("Ajouter", "Add")}</Button>
              </div>
            </form>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
