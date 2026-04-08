import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../api/client";
import PageHeader from "../../components/ui/PageHeader";
import { getErrorMessage } from "../../utils/http";
import { Card, CardHeader } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import ProjectProgress from "../../components/projects/ProjectProgress";

export default function ProjectDetailsPage() {
  const { projectId } = useParams();
  const [state, setState] = useState({ loading: true, error: "", project: null });

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const { data } = await api.get(`/projects/${projectId}`);
        if (mounted) {
          setState({ loading: false, error: "", project: data.data });
        }
      } catch (error) {
        if (mounted) {
          setState({ loading: false, error: getErrorMessage(error), project: null });
        }
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [projectId]);

  const grouped = useMemo(() => {
    const tasks = state.project?.tasks || [];
    return {
      TODO: tasks.filter((task) => task.status === "TODO"),
      IN_PROGRESS: tasks.filter((task) => task.status === "IN_PROGRESS"),
      DONE: tasks.filter((task) => task.status === "DONE"),
    };
  }, [state.project]);

  if (state.loading) return <div className="saas-card p-6">Loading project details...</div>;
  if (state.error) return <div className="saas-card p-6 text-rose-700">{state.error}</div>;

  const project = state.project;

  return (
    <div className="space-y-4">
      <PageHeader title={project.name} subtitle={project.description || "No description"} />

      <Card className="p-5">
        <CardHeader title="Progress Snapshot" subtitle="Automatic project progress based on current task execution." />
        <ProjectProgress
          progress={project.progress}
          status={project.computedStatus}
          completedTasks={project.completedTasks}
          totalTasks={project.totalTasks}
        />
      </Card>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="p-5">
          <CardHeader title="Todo" subtitle="Pending tasks" />
          <p className="text-3xl font-semibold text-slate-900">{grouped.TODO.length}</p>
        </Card>
        <Card className="p-5">
          <CardHeader title="In Progress" subtitle="Ongoing tasks" />
          <p className="text-3xl font-semibold text-slate-900">{grouped.IN_PROGRESS.length}</p>
        </Card>
        <Card className="p-5">
          <CardHeader title="Done" subtitle="Completed tasks" />
          <p className="text-3xl font-semibold text-slate-900">{grouped.DONE.length}</p>
        </Card>
      </section>

      <Card className="p-0 overflow-hidden">
        <div className="px-5 pt-5">
          <CardHeader title="Tasks" subtitle="Current project task list and ownership." />
        </div>
        <div className="overflow-x-auto px-5 pb-5">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2">Title</th>
                <th className="py-2">Status</th>
                <th className="py-2">Assignee</th>
                <th className="py-2">Process</th>
              </tr>
            </thead>
            <tbody>
              {project.tasks.map((task) => (
                <tr key={task.id} className="border-b border-slate-100">
                  <td className="py-2 text-slate-900">{task.title}</td>
                  <td className="py-2">
                    <Badge tone={task.status === "DONE" ? "green" : task.status === "IN_PROGRESS" ? "blue" : "amber"}>
                      {task.status.replaceAll("_", " ")}
                    </Badge>
                  </td>
                  <td className="py-2 text-slate-700">{task.assignee?.fullName || "Unassigned"}</td>
                  <td className="py-2 text-slate-700">{task.process?.name || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div>
        <Link className="text-sm font-medium text-emerald-700 hover:text-emerald-800" to="/projects">
          Back to projects
        </Link>
      </div>
    </div>
  );
}
