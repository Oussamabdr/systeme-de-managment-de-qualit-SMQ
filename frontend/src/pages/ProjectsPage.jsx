import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import PageHeader from "../components/ui/PageHeader";
import { getErrorMessage } from "../utils/http";
import { Card, CardHeader } from "../components/ui/Card";
import { Input, Select, TextArea } from "../components/ui/Input";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { Table } from "../components/ui/Table";
import { useAuthStore } from "../store/authStore";
import ProjectProgress from "../components/projects/ProjectProgress";

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
    try {
      await api.post("/projects", form);
      setForm(initialForm);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const applyProjectTemplate = (template) => {
    if (template === "certification") {
      setForm({
        name: "ISO 9001 Certification Readiness",
        description: "Coordinate gap closure, internal audit preparation, and management review milestones for certification readiness.",
      });
      return;
    }

    if (template === "supplier") {
      setForm({
        name: "Supplier Quality Improvement Program",
        description: "Improve supplier conformity through audit planning, corrective actions, and performance monitoring KPIs.",
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
      <PageHeader title="Program Portfolio" subtitle="Steer delivery performance, quality risk, and cross-process alignment." />

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card className="p-0 overflow-hidden">
          <div className="px-5 pt-5">
            <CardHeader title="Project Portfolio" subtitle="High-level quality program progress overview." />
          </div>
          {error ? <p className="px-5 pb-4 text-sm text-rose-700">{error}</p> : null}
          <Table headers={["Project", "Health", "Processes", "Progress", "Actions"]}>
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
              <CardHeader title="Create Project" subtitle="Add a new certification initiative." />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" variant="subtle" className="px-3 py-1.5 text-xs" onClick={() => applyProjectTemplate("certification")}>
                  Use Certification Template
                </Button>
                <Button type="button" variant="subtle" className="px-3 py-1.5 text-xs" onClick={() => applyProjectTemplate("supplier")}>
                  Use Supplier Template
                </Button>
                <Button type="button" variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => applyProjectTemplate("reset")}>
                  Reset
                </Button>
              </div>
              <form className="mt-3 space-y-3" onSubmit={createProject}>
                <div className="field-group">
                  <label className="field-label">Project Name</label>
                  <Input placeholder="e.g. Internal Audit Readiness 2026" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
                </div>
                <div className="field-group">
                  <label className="field-label">Description</label>
                  <TextArea placeholder="State objective, scope, and expected quality outcomes." rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
                  <p className="field-help">Tip: describe measurable outcome and deadline context for easier steering.</p>
                </div>
                <Button className="w-full">Save Project</Button>
              </form>
            </Card>
          ) : null}

          {canManage ? (
            <Card className="p-5">
              <CardHeader title="Assign Processes" subtitle="Map controlled processes to a selected project." />
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
