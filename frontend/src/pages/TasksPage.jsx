import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DndContext, PointerSensor, closestCorners, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import api from "../api/client";
import PageHeader from "../components/ui/PageHeader";
import { getErrorMessage } from "../utils/http";
import { Card, CardHeader } from "../components/ui/Card";
import { Select } from "../components/ui/Input";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import TaskCard from "../components/tasks/TaskCard";
import TaskRow from "../components/tasks/TaskRow";
import { useAuthStore } from "../store/authStore";
import { useFormValidation, fieldValidationRules } from "../hooks/useFormValidation";
import { FormErrors, FormField, SuccessMessage } from "../components/form/FormField";
import { useUiStore } from "../store/uiStore";
import { t } from "../utils/i18n";

const getStatusMap = (language) => ({
  TODO: t(language, "À faire", "Todo"),
  IN_PROGRESS: t(language, "En cours", "In Progress"),
  DONE: t(language, "Terminé", "Done"),
});

const initialForm = {
  title: "",
  description: "",
  projectId: "",
  processId: "",
  assigneeId: "",
  dueDate: "",
};

function KanbanColumn({ id, title, count, children }) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <Card
      className={`min-h-70 p-4 transition-colors duration-200 ${isOver ? "bg-emerald-50/60" : "bg-white"}`}
      ref={setNodeRef}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <Badge tone="slate">{count}</Badge>
      </div>
      <div className="space-y-3">{children}</div>
    </Card>
  );
}

export default function TasksPage() {
  const [searchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const isProjectManager = user?.role === "PROJECT_MANAGER";
  const isTeamMember = user?.role === "TEAM_MEMBER";
  const canCreateTask = isProjectManager;
  const canManageAssignment = isProjectManager;

  const processFilterFromUrl = searchParams.get("processId") || "";
  const quickAssign = searchParams.get("quickAssign") === "1";

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [viewMode, setViewMode] = useState("table");
  const [filterProcessId, setFilterProcessId] = useState(processFilterFromUrl);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { errors, touched, isSubmitting, setIsSubmitting, markFieldTouched, validateField, clearErrors, handleApiError } = useFormValidation();
  const language = useUiStore((state) => state.language);
  const text = (fr, en) => t(language, fr, en);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const taskTemplates = {
    audit: {
      title: text("Preparer le rapport d'audit interne", "Prepare internal audit report"),
      description: text(
        "Compiler les constats, evidences et recommandations pour validation.",
        "Compile findings, evidence, and recommendations.",
      ),
      dueInDays: 7,
    },
    supplier: {
      title: text("Verifier la conformite fournisseur", "Verify supplier conformity"),
      description: text(
        "Reviser le dossier fournisseur et verifier les ecarts de livraison.",
        "Review supplier file and delivery deviations.",
      ),
      dueInDays: 14,
    },
    control: {
      title: text("Verifier les documents de controle", "Verify controlled documents"),
      description: text(
        "Controler les versions, signatures et preuves de diffusion.",
        "Check versions, signatures, and evidence of distribution.",
      ),
      dueInDays: 10,
    },
  };

  const load = async () => {
    try {
      const requests = [api.get("/tasks"), api.get("/projects"), api.get("/processes")];
      if (canManageAssignment) {
        requests.push(api.get("/users"));
      }

      const [tasksRes, projectsRes, processRes, usersRes] = await Promise.all(requests);
      setTasks(tasksRes.data.data || []);
      setProjects(projectsRes.data.data || []);
      setProcesses(processRes.data.data || []);
      setUsers(usersRes?.data?.data || []);

      setForm((prev) => ({
        ...prev,
        projectId: prev.projectId || projectsRes.data.data?.[0]?.id || "",
        processId: prev.processId || processFilterFromUrl || processRes.data.data?.[0]?.id || "",
      }));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setFilterProcessId(processFilterFromUrl);
    setForm((prev) => ({
      ...prev,
      processId: processFilterFromUrl || prev.processId,
    }));
  }, [processFilterFromUrl]);

  const visibleTasks = useMemo(
    () => (filterProcessId ? tasks.filter((task) => task.processId === filterProcessId) : tasks),
    [tasks, filterProcessId],
  );

  const grouped = useMemo(
    () => ({
      TODO: visibleTasks.filter((task) => task.status === "TODO"),
      IN_PROGRESS: visibleTasks.filter((task) => task.status === "IN_PROGRESS"),
      DONE: visibleTasks.filter((task) => task.status === "DONE"),
    }),
    [visibleTasks],
  );

  const createTask = async (event) => {
    event.preventDefault();
    if (!canCreateTask) return;

    clearErrors();
    setSuccessMessage("");
    markFieldTouched("title");
    markFieldTouched("dueDate");
    markFieldTouched("projectId");
    markFieldTouched("processId");
    markFieldTouched("description");

    const titleError = validateField(
      "title",
      form.title,
      fieldValidationRules.combine(
        fieldValidationRules.required,
        fieldValidationRules.minLength(3),
        fieldValidationRules.maxLength(200),
      ),
    );
    const descriptionError = validateField(
      "description",
      form.description,
      fieldValidationRules.maxLength(1000),
    );
    const dueDateError = validateField(
      "dueDate",
      form.dueDate,
      fieldValidationRules.combine(
        fieldValidationRules.date,
        fieldValidationRules.futureDate,
      ),
    );
    const projectError = validateField(
      "projectId",
      form.projectId,
      fieldValidationRules.required,
    );
    const processError = validateField(
      "processId",
      form.processId,
      fieldValidationRules.required,
    );

    if (titleError || descriptionError || dueDateError || projectError || processError) {
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/tasks", {
        title: form.title,
        description: form.description || null,
        projectId: form.projectId,
        processId: form.processId,
        assigneeId: form.assigneeId || null,
        dueDate: form.dueDate || null,
        status: "TODO",
      });

      setForm((prev) => ({
        ...initialForm,
        projectId: prev.projectId,
        processId: prev.processId,
      }));
      setSuccessMessage(text("Tache creee avec succes !", "Task created successfully!"));
      setTimeout(() => setSuccessMessage(""), 3000);
      await load();
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

  const updateTaskInline = async (taskId, payload) => {
    try {
      await api.patch(`/tasks/${taskId}`, payload);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    const previous = tasks;
    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, status } : task)));

    try {
      await api.patch(`/tasks/${taskId}`, { status });
      await load();
    } catch (err) {
      setTasks(previous);
      setError(getErrorMessage(err));
    }
  };

  const getFutureDate = (daysFromNow) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().slice(0, 10);
  };

  const applyTaskTemplate = (templateKey) => {
    const template = taskTemplates[templateKey];
    if (!template) {
      setForm((prev) => ({
        ...initialForm,
        projectId: prev.projectId,
        processId: prev.processId,
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      title: template.title,
      description: template.description,
      dueDate: getFutureDate(template.dueInDays),
    }));
  };

  const getDropStatus = (overId) => {
    if (!overId) return null;
    if (["TODO", "IN_PROGRESS", "DONE"].includes(overId)) return overId;
    if (overId.startsWith("task:")) {
      const taskId = overId.replace("task:", "");
      return visibleTasks.find((task) => task.id === taskId)?.status || null;
    }
    return null;
  };

  const onDragEnd = (event) => {
    const activeId = event.active?.id?.toString();
    const overId = event.over?.id?.toString();
    if (!activeId || !overId || !activeId.startsWith("task:")) return;

    const taskId = activeId.replace("task:", "");
    const destinationStatus = getDropStatus(overId);
    const source = visibleTasks.find((task) => task.id === taskId);

    if (!source || !destinationStatus || source.status === destinationStatus) return;
    updateTaskStatus(taskId, destinationStatus);
  };

  return (
    <div className="space-y-4">
      <PageHeader title={text("Tableau de commande d'execution", "Execution Control Board")} subtitle={text("Coordonner les affectations, les echeances et le debit operationnel dans un seul flux.", "Coordinate assignments, deadlines, and operational throughput in one flow.")} />
      {error ? <p className="saas-card p-4 text-sm text-rose-700">{error}</p> : null}

      {quickAssign ? (
        <div className="saas-card border border-emerald-200 bg-emerald-50/50 p-4 text-sm text-emerald-900">
          {text("Mode affectation rapide active depuis la vue processus. Votre filtre de processus est pre-selectionne.", "Quick assign mode enabled from process view. Your process filter is pre-selected.")}
        </div>
      ) : null}

      {canCreateTask ? (
        <section className="saas-card p-5">
          <CardHeader
            title={text("Creer une tache", "Create Task")}
            subtitle={text("L'affectation se fait a la creation.", "Assignment happens during creation.")}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="subtle" className="px-3 py-1.5 text-xs" onClick={() => applyTaskTemplate("audit")}>
              {text("Modele audit interne", "Internal audit template")}
            </Button>
            <Button type="button" variant="subtle" className="px-3 py-1.5 text-xs" onClick={() => applyTaskTemplate("supplier")}>
              {text("Modele fournisseur", "Supplier template")}
            </Button>
            <Button type="button" variant="subtle" className="px-3 py-1.5 text-xs" onClick={() => applyTaskTemplate("control")}>
              {text("Modele controle documentaire", "Document control template")}
            </Button>
            <Button type="button" variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => applyTaskTemplate("reset")}>
              {text("Reinitialiser", "Reset")}
            </Button>
          </div>
          <form className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3" onSubmit={createTask}>
            <div className="md:col-span-2 xl:col-span-3">
              <SuccessMessage message={successMessage} onDismiss={() => setSuccessMessage("")} />
              <FormErrors errors={errors} />
            </div>

            <FormField
              label={text("Titre de la tache", "Task Title")}
              name="title"
              type="text"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              onBlur={() => markFieldTouched("title")}
              error={errors.title}
              touched={touched.title}
              placeholder={text("ex. Valider le rapport fournisseur", "e.g. Validate supplier audit report")}
              helpText={text("Minimum 3 caracteres", "Minimum 3 characters")}
              required
            />

            <FormField
              label={text("Date limite", "Deadline")}
              name="dueDate"
              type="date"
              value={form.dueDate}
              onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
              onBlur={() => markFieldTouched("dueDate")}
              error={errors.dueDate}
              touched={touched.dueDate}
              helpText={text("Aujourd'hui ou plus tard", "Must be today or later")}
            />

            <FormField
              label={text("Projet", "Project")}
              name="projectId"
              type="select"
              value={form.projectId}
              onChange={(event) => setForm((prev) => ({ ...prev, projectId: event.target.value }))}
              onBlur={() => markFieldTouched("projectId")}
              error={errors.projectId}
              touched={touched.projectId}
              required
            >
              <option value="">{text("Selectionner un projet", "Select project")}</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </FormField>

            <FormField
              label={text("Processus", "Process")}
              name="processId"
              type="select"
              value={form.processId}
              onChange={(event) => setForm((prev) => ({ ...prev, processId: event.target.value }))}
              onBlur={() => markFieldTouched("processId")}
              error={errors.processId}
              touched={touched.processId}
              required
            >
              <option value="">{text("Selectionner un processus", "Select process")}</option>
              {processes.map((process) => (
                <option key={process.id} value={process.id}>{process.name}</option>
              ))}
            </FormField>

            <FormField
              label={text("Responsable", "Assignee")}
              name="assigneeId"
              type="select"
              value={form.assigneeId}
              onChange={(event) => setForm((prev) => ({ ...prev, assigneeId: event.target.value }))}
              onBlur={() => markFieldTouched("assigneeId")}
              error={errors.assigneeId}
              touched={touched.assigneeId}
              helpText={text("Affectation optionnelle", "Optional assignment")}
            >
              <option value="">{text("Selectionner un responsable (optionnel)", "Select assignee (optional)")}</option>
              {users.map((member) => (
                <option key={member.id} value={member.id}>{member.fullName}</option>
              ))}
            </FormField>

            <FormField
              label={text("Description", "Description")}
              name="description"
              type="textarea"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              onBlur={() => markFieldTouched("description")}
              error={errors.description}
              touched={touched.description}
              placeholder={text(
                "Decrire livrables, criteres d'acceptation et dependances.",
                "Describe expected deliverable, acceptance criteria, and dependencies.",
              )}
              helpText={text("1000 caracteres max", "Max 1000 characters")}
              className="md:col-span-2 xl:col-span-3"
            />

            <Button className="md:col-span-2 xl:col-span-3" disabled={isSubmitting}>
              {isSubmitting ? text("Enregistrement...", "Saving...") : text("Creer la tache", "Create Task")}
            </Button>
          </form>
        </section>
      ) : null}

      <section className="saas-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Select className="w-full sm:w-72" value={filterProcessId} onChange={(event) => setFilterProcessId(event.target.value)}>
            <option value="">{text("Tous les processus", "All processes")}</option>
            {processes.map((process) => (
              <option key={process.id} value={process.id}>{process.name}</option>
            ))}
          </Select>

          <div className="flex items-center gap-2">
            <Button type="button" variant={viewMode === "table" ? "primary" : "subtle"} className="px-3 py-2 text-xs" onClick={() => setViewMode("table")}>{text("Tableau", "Table")}</Button>
            <Button type="button" variant={viewMode === "kanban" ? "primary" : "subtle"} className="px-3 py-2 text-xs" onClick={() => setViewMode("kanban")}>{text("Kanban", "Kanban")}</Button>
          </div>
        </div>
      </section>

      {viewMode === "table" ? (
        <Card className="p-0 overflow-hidden">
          <div className="px-5 pt-5">
            <CardHeader title={text("Tableau d'affectation direct", "Inline Assignment Table")} subtitle={text("Modifiez le processus, le responsable et la date limite directement dans chaque ligne.", "Edit process, assignee, and deadline directly in each row.")} />
          </div>
          <div className="overflow-x-auto pb-4">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="px-4 py-3">{text("Tache", "Task")}</th>
                  <th className="px-4 py-3">{text("Statut", "Status")}</th>
                  <th className="px-4 py-3">{text("Processus", "Process")}</th>
                  <th className="px-4 py-3">{text("Responsable", "Assignee")}</th>
                  <th className="px-4 py-3">{text("Date limite", "Deadline")}</th>
                </tr>
              </thead>
              <tbody>
                {visibleTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    processes={processes}
                    users={users}
                    language={language}
                    canManageAssignment={canManageAssignment}
                    canEditStatus={isProjectManager || (isTeamMember && task.assigneeId === user?.id)}
                    onInlineChange={updateTaskInline}
                    onStatusChange={updateTaskStatus}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
          <section className="grid gap-4 lg:grid-cols-3">
            {Object.entries(getStatusMap(language)).map(([status, title]) => (
              <KanbanColumn key={status} id={status} title={title} count={grouped[status]?.length || 0}>
                {(grouped[status] || []).map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    processes={processes}
                    users={users}
                    language={language}
                    canManageAssignment={canManageAssignment}
                    canEditStatus={isProjectManager || (isTeamMember && task.assigneeId === user?.id)}
                    onStatusChange={updateTaskStatus}
                    onInlineChange={updateTaskInline}
                  />
                ))}
              </KanbanColumn>
            ))}
          </section>
        </DndContext>
      )}
    </div>
  );
}
