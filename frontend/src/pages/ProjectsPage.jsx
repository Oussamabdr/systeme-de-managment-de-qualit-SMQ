import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import PageHeader from "../components/ui/PageHeader";
import { getErrorMessage } from "../utils/http";
import { Card, CardHeader } from "../components/ui/Card";
import { Input, Select } from "../components/ui/Input";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { Table } from "../components/ui/Table";
import { useAuthStore } from "../store/authStore";
import ProjectProgress from "../components/projects/ProjectProgress";
import { useFormValidation, fieldValidationRules } from "../hooks/useFormValidation";
import { FormErrors, FormField, SuccessMessage } from "../components/form/FormField";
import { useUiStore } from "../store/uiStore";
import { t } from "../utils/i18n";

const initialForm = {
  name: "",
  description: "",
};

export default function ProjectsPage() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN";
  const canManage = user?.role === "ADMIN" || user?.role === "PROJECT_MANAGER";

  const [projects, setProjects] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedProcesses, setSelectedProcesses] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingProjectId, setEditingProjectId] = useState("");
  const [editForm, setEditForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { errors, touched, isSubmitting, setIsSubmitting, markFieldTouched, validateField, clearErrors, handleApiError } = useFormValidation();
  const language = useUiStore((state) => state.language);
  const text = (fr, en) => t(language, fr, en);

  const load = async () => {
    try {
      const [projectsRes, processRes] = await Promise.all([api.get("/projects"), api.get("/processes")]);
      setProjects(projectsRes.data.data);
      setProcesses(processRes.data.data);
      if (projectsRes.data.data[0]) setSelectedProjectId(projectsRes.data.data[0].id);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createProject = async (event) => {
    event.preventDefault();

    clearErrors();
    setSuccessMessage("");
    markFieldTouched("name");
    markFieldTouched("description");

    const nameError = validateField(
      "name",
      form.name,
      fieldValidationRules.combine(
        fieldValidationRules.required,
        fieldValidationRules.minLength(2),
        fieldValidationRules.maxLength(150),
      ),
    );
    const descriptionError = validateField(
      "description",
      form.description,
      fieldValidationRules.maxLength(500),
    );

    if (nameError || descriptionError) {
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/projects", form);
      setForm(initialForm);
      setSuccessMessage(text("Projet cree avec succes !", "Project created successfully!"));
      setTimeout(() => setSuccessMessage(""), 3000);
      load();
    } catch (err) {
      if (err.response?.data?.fieldErrors) {
        handleApiError(err.response.data);
      } else {
        handleApiError({ message: getErrorMessage(err), fieldErrors: {} });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyProjectTemplate = (template) => {
    if (template === "certification") {
      setForm({
        name: text("Preparation a la certification ISO 9001", "ISO 9001 Certification Readiness"),
        description: text(
          "Coordonner la fermeture des ecarts, la preparation des audits internes et les jalons de revue de direction.",
          "Coordinate gap closure, internal audit preparation, and management review milestones for certification readiness.",
        ),
      });
      return;
    }

    if (template === "supplier") {
      setForm({
        name: text("Programme d'amelioration fournisseur", "Supplier Quality Improvement Program"),
        description: text(
          "Ameliorer la conformite fournisseur via audits, actions correctives et suivi des indicateurs.",
          "Improve supplier conformity through audit planning, corrective actions, and performance monitoring KPIs.",
        ),
      });
      return;
    }

    setForm(initialForm);
  };

  const startEdit = (project) => {
    setEditingProjectId(project.id);
    setEditForm({
      name: project.name || "",
      description: project.description || "",
    });
  };

  const cancelEdit = () => {
    setEditingProjectId("");
    setEditForm(initialForm);
  };

  const saveEdit = async (projectId) => {
    try {
      await api.patch(`/projects/${projectId}`, editForm);
      cancelEdit();
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const removeProject = async (projectId, projectName) => {
    if (!window.confirm(`Supprimer le projet \"${projectName}\" ?`)) return;

    try {
      await api.delete(`/projects/${projectId}`);
      if (selectedProjectId === projectId) {
        setSelectedProjectId("");
      }
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const assign = async () => {
    if (!selectedProjectId) return;
    try {
      await api.post(`/projects/${selectedProjectId}/processes`, { processIds: selectedProcesses });
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader title={text("Portefeuille de programmes", "Program Portfolio")} subtitle={text("Orienter la performance de livraison, le risque de qualite et l'alignement inter-processus.", "Steer delivery performance, quality risk, and cross-process alignment.")} />

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card className="p-0 overflow-hidden">
          <div className="px-5 pt-5">
            <CardHeader title={text("Portefeuille de projets", "Project Portfolio")} subtitle={text("Aperçu de la progression du programme qualite de haut niveau.", "High-level quality program progress overview.")} />
          </div>
          {error ? <p className="px-5 pb-4 text-sm text-rose-700">{error}</p> : null}
          <Table headers={[text("Projet", "Project"), text("Sante", "Health"), text("Processus", "Processes"), text("Progression", "Progress"), text("Actions", "Actions")]}>
            {projects.map((project) => {
              return (
                <tr key={project.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {editingProjectId === project.id ? (
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                      />
                    ) : (
                      <Link className="text-emerald-700 hover:text-emerald-800" to={`/projects/${project.id}`}>
                        {project.name}
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={project.computedStatus === "Completed" ? "green" : project.computedStatus === "Delayed" ? "red" : project.computedStatus === "At Risk" ? "amber" : "blue"}>
                      {project.computedStatus || "On Track"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{project.processes.length}</td>
                  <td className="px-4 py-3">
                    <ProjectProgress
                      progress={project.progress}
                      status={project.computedStatus}
                      completedTasks={project.completedTasks}
                      totalTasks={project.totalTasks}
                    />
                  </td>
                  <td className="px-4 py-3">
                    {canManage ? (
                      <div className="flex flex-wrap gap-2">
                        {editingProjectId === project.id ? (
                          <>
                            <Button type="button" className="px-3 py-1.5 text-xs" onClick={() => saveEdit(project.id)}>Save</Button>
                            <Button type="button" variant="subtle" className="px-3 py-1.5 text-xs" onClick={cancelEdit}>Cancel</Button>
                          </>
                        ) : (
                          <>
                            <Button type="button" variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => startEdit(project)}>Edit</Button>
                            {isAdmin ? (
                              <Button
                                type="button"
                                variant="subtle"
                                className="px-3 py-1.5 text-xs text-rose-700"
                                onClick={() => removeProject(project.id, project.name)}
                              >
                                Delete
                              </Button>
                            ) : null}
                          </>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">No actions</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </Table>
        </Card>

        <div className="space-y-4">
          {canManage ? (
            <Card className="p-5">
              <CardHeader title={text("Creer un projet", "Create Project")} subtitle={text("Ajouter une initiative de certification.", "Add a new certification initiative.")} />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" variant="subtle" className="px-3 py-1.5 text-xs" onClick={() => applyProjectTemplate("certification")}>
                  {text("Modele certification", "Use Certification Template")}
                </Button>
                <Button type="button" variant="subtle" className="px-3 py-1.5 text-xs" onClick={() => applyProjectTemplate("supplier")}>
                  {text("Modele fournisseur", "Use Supplier Template")}
                </Button>
                <Button type="button" variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => applyProjectTemplate("reset")}>
                  {text("Reinitialiser", "Reset")}
                </Button>
              </div>
              <form className="mt-3 space-y-3" onSubmit={createProject}>
                <SuccessMessage message={successMessage} onDismiss={() => setSuccessMessage("")} />
                <FormErrors errors={errors} />

                <FormField
                  label={text("Nom du projet", "Project Name")}
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  onBlur={() => markFieldTouched("name")}
                  error={errors.name}
                  touched={touched.name}
                  placeholder={text("ex. Preparation audit interne 2026", "e.g. Internal Audit Readiness 2026")}
                  helpText={text("Minimum 2 caracteres", "Minimum 2 characters")}
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
                  placeholder={text(
                    "Indiquer objectif, perimetre et resultats attendus.",
                    "State objective, scope, and expected quality outcomes.",
                  )}
                  helpText={text("Max 500 caracteres", "Max 500 characters")}
                />

                <Button className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? text("Enregistrement...", "Saving...") : text("Enregistrer le projet", "Save Project")}
                </Button>
              </form>
            </Card>
          ) : null}

          {canManage ? (
            <Card className="p-5">
              <CardHeader title={text("Assigner les processus", "Assign Processes")} subtitle={text("Mapper les processus controles a un projet selectionne.", "Map controlled processes to a selected project.")} />
              <Select className="mt-3" value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </Select>
              <div className="mt-3 max-h-44 space-y-2 overflow-y-auto rounded-xl border border-slate-200/80 bg-slate-50 p-3">
                {processes.map((process) => (
                  <label key={process.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedProcesses.includes(process.id)}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setSelectedProcesses((prev) => [...prev, process.id]);
                        } else {
                          setSelectedProcesses((prev) => prev.filter((id) => id !== process.id));
                        }
                      }}
                    />
                    {process.name}
                  </label>
                ))}
              </div>
              <Button className="mt-3 w-full" onClick={assign}>Assign</Button>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
