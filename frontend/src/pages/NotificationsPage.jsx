import { useEffect, useState } from "react";
import api from "../api/client";
import PageHeader from "../components/ui/PageHeader";
import { getErrorMessage } from "../utils/http";
import { Card, CardHeader } from "../components/ui/Card";
import Badge from "../components/ui/Badge";

export default function NotificationsPage() {
  const [state, setState] = useState({ loading: true, data: null, error: "" });

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const { data } = await api.get("/notifications");
        if (mounted) setState({ loading: false, data: data.data, error: "" });
      } catch (error) {
        if (mounted) setState({ loading: false, data: null, error: getErrorMessage(error) });
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (state.loading) return <div className="saas-card p-6">Loading alerts...</div>;
  if (state.error) return <div className="saas-card p-6 text-rose-700">{state.error}</div>;

  const { overdueTasks, delayedProjects } = state.data;

  return (
    <div className="space-y-4">
      <PageHeader title="Risk and Delay Alerts" subtitle="Escalation feed for overdue tasks and delayed programs." />

      <section className="saas-card p-5">
        <CardHeader title="Overdue Tasks" subtitle="Items requiring immediate corrective action." action={<Badge tone="red">{overdueTasks.length}</Badge>} />
        <div className="mt-3 space-y-2">
          {overdueTasks.map((task) => (
            <article key={task.id} className="rounded-xl border border-rose-100 bg-rose-50/60 p-3 text-sm text-rose-900">
              <p className="font-semibold">{task.title}</p>
              <p className="mt-1 text-rose-800/80">Project: {task.project?.name} | Assignee: {task.assignee?.fullName || "Unassigned"}</p>
            </article>
          ))}
          {overdueTasks.length === 0 ? <p className="text-sm text-slate-500">No overdue tasks.</p> : null}
        </div>
      </section>

      <section className="saas-card p-5">
        <CardHeader title="Delayed Projects" subtitle="Programs at risk versus baseline planning." action={<Badge tone="amber">{delayedProjects.length}</Badge>} />
        <div className="mt-3 space-y-2">
          {delayedProjects.map((project) => (
            <article key={project.id} className="rounded-xl border border-amber-100 bg-amber-50/60 p-3 text-sm text-amber-900">
              <p className="font-semibold">{project.name}</p>
              <p className="mt-1 text-amber-800/80">Status: {project.status}</p>
            </article>
          ))}
          {delayedProjects.length === 0 ? <p className="text-sm text-slate-500">No delayed projects.</p> : null}
        </div>
      </section>
    </div>
  );
}
