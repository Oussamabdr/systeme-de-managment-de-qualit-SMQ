import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Mail, ShieldAlert, TriangleAlert } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import api from "../api/client";
import PageHeader from "../components/ui/PageHeader";
import { getErrorMessage } from "../utils/http";
import { Card, CardHeader } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { useUiStore } from "../store/uiStore";
import { t } from "../utils/i18n";

function roleLabel(role, text) {
  const labels = {
    ADMIN: text("Direction Generale Qualite", "Quality Executive Office"),
    PROJECT_MANAGER: text("Responsable projet", "Project Manager"),
    TEAM_MEMBER: text("Membre equipe", "Team Member"),
    CAQ: "CAQ",
  };
  return labels[role] || role?.replaceAll("_", " ");
}

export default function NotificationsPage() {
  const [state, setState] = useState({ loading: true, data: null, error: "" });
  const language = useUiStore((store) => store.language);
  const text = (fr, en) => t(language, fr, en);

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

  if (state.loading) return <div className="saas-card p-6">{text("Chargement de la reception...", "Loading inbox...")}</div>;
  if (state.error) return <div className="saas-card p-6 text-rose-700">{state.error}</div>;

  const { overdueTasks = [], delayedProjects = [], receivedReports = [] } = state.data || {};

  const chartData = {
    inbox: [
      { name: text("Rapports", "Reports"), value: receivedReports.length, color: "#3b82f6" },
      { name: text("Taches en retard", "Overdue tasks"), value: overdueTasks.length, color: "#ef4444" },
      { name: text("Projets retardes", "Delayed projects"), value: delayedProjects.length, color: "#f97316" },
    ],
    severity: Object.entries(
      receivedReports.reduce((acc, r) => {
        acc[r.severity] = (acc[r.severity] || 0) + 1;
        return acc;
      }, {})
    ).map(([name, value]) => ({ name, value })),
    status: Object.entries(
      receivedReports.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {})
    ).map(([name, value]) => ({ name, value })),
  };

  const severityColors = { CRITICAL: "#ef4444", HIGH: "#f97316", MEDIUM: "#3b82f6", LOW: "#22c55e" };
  const statusColors = { OPEN: "#eab308", IN_PROGRESS: "#3b82f6", DONE: "#22c55e", CANCELLED: "#94a3b8" };

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
        title={text("Reception des rapports", "Report inbox")}
        subtitle={text(
          "Espace clair pour voir les rapports recus, les alertes et les dossiers a traiter.",
          "A clear place to see received reports, alerts, and items to handle.",
        )}
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <CardHeader title={text("Distribution", "Distribution")} subtitle={text("Vue d ensemble.", "Overview.")} />
          <div className="mt-3 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData.inbox} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70}>
                  {chartData.inbox.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<SimpleTooltip />} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <CardHeader title={text("Severite rapports", "Report severity")} subtitle={text("Repartition par gravite.", "By severity.")} />
          <div className="mt-3 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.severity}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<SimpleTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.severity.map((entry) => (
                    <Cell key={entry.name} fill={severityColors[entry.name] || "#94a3b8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <CardHeader title={text("Statut rapports", "Report status")} subtitle={text("Repartition par statut.", "By status.")} />
          <div className="mt-3 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.status}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<SimpleTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.status.map((entry) => (
                    <Cell key={entry.name} fill={statusColors[entry.name] || "#94a3b8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-5">
          <CardHeader
            title={text("Rapports recus", "Received reports")}
            subtitle={text(
              "Les signalements adresses a votre role apparaissent ici.",
              "Reports routed to your role appear here.",
            )}
            action={<Badge tone="blue">{receivedReports.length}</Badge>}
          />
          <div className="mt-4 space-y-3">
            {receivedReports.map((report) => {
              const dueOver = report.dueDate && new Date(report.dueDate) < new Date() && report.status !== "DONE";
              return (
                <article key={report.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">{report.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {text("Envoye par", "Sent by")} {report.createdBy?.fullName || "-"} • {roleLabel(report.createdBy?.role, text)} • {new Date(report.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {report.actionType && (
                        <Badge tone="purple">
                          {report.actionType}
                        </Badge>
                      )}
                      <Badge tone={report.severity === "CRITICAL" ? "red" : report.severity === "HIGH" ? "amber" : "blue"}>
                        {report.severity}
                      </Badge>
                      <Badge tone="slate">{report.status}</Badge>
                      {dueOver && <Badge tone="red">{text("Expire", "Overdue")}</Badge>}
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-700 whitespace-pre-line">{report.description}</p>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-600">
                      <span className="block font-semibold text-slate-900">{text("Destinataire", "Recipient")}</span>
                      {report.owner?.fullName || text("Role cible", "Target role")}
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-600">
                      <span className="block font-semibold text-slate-900">{text("Source", "Source")}</span>
                      {report.source || "-"}
                    </div>
                    {report.dueDate && (
                      <div className={`rounded-lg border px-3 py-2 text-xs ${dueOver ? "border-rose-200 bg-rose-50/60 text-rose-700" : "border-slate-200 bg-white/80 text-slate-600"}`}>
                        <span className="block font-semibold text-slate-900">{text("Date limite", "Due date")}</span>
                        {new Date(report.dueDate).toLocaleDateString()} {dueOver && <span className="font-semibold">({text("expire", "expired")})</span>}
                      </div>
                    )}
                    {(report.processName || report.projectName || report.isoClause) && (
                      <div className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-600">
                        <span className="block font-semibold text-slate-900">{text("Lien", "Link")}</span>
                        {report.processName && <span>{report.processName}</span>}
                        {report.projectName && <span>{report.processName ? " • " : ""}{report.projectName}</span>}
                        {report.isoClause && <span>{(report.processName || report.projectName) ? " • " : ""}ISO {report.isoClause}</span>}
                      </div>
                    )}
                    {report.containmentAction && (
                      <div className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-600 md:col-span-2">
                        <span className="block font-semibold text-slate-900">{text("Action de confinement", "Containment action")}</span>
                        {report.containmentAction}
                      </div>
                    )}
                    {report.rootCause && (
                      <div className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-600 md:col-span-2">
                        <span className="block font-semibold text-slate-900">{text("Cause racine", "Root cause")}</span>
                        {report.rootCause}
                      </div>
                    )}
                    <div className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-600">
                      <span className="block font-semibold text-slate-900">{text("Mise a jour", "Updated")}</span>
                      {new Date(report.updatedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link className="saas-btn saas-btn-subtle px-3 py-2 text-sm" to="/corrective-actions">
                      {text("Ouvrir le suivi", "Open follow-up")}
                    </Link>
                  </div>
                </article>
              );
            })}
            {receivedReports.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-5 text-sm text-slate-500">
                {text("Aucun rapport recu pour le moment.", "No received reports for now.")}
              </div>
            ) : null}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <CardHeader
              title={text("Synthese reception", "Inbox summary")}
              subtitle={text("Vue rapide des signaux a traiter.", "Fast view of signals to handle.")}
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Mail size={16} />
                  <span className="text-xs font-semibold uppercase tracking-[0.08em]">{text("Rapports", "Reports")}</span>
                </div>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{receivedReports.length}</p>
              </div>
              <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-4">
                <div className="flex items-center gap-2 text-rose-600">
                  <TriangleAlert size={16} />
                  <span className="text-xs font-semibold uppercase tracking-[0.08em]">{text("Taches en retard", "Overdue tasks")}</span>
                </div>
                <p className="mt-2 text-2xl font-semibold text-rose-900">{overdueTasks.length}</p>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-4">
                <div className="flex items-center gap-2 text-amber-700">
                  <ShieldAlert size={16} />
                  <span className="text-xs font-semibold uppercase tracking-[0.08em]">{text("Projets retardes", "Delayed projects")}</span>
                </div>
                <p className="mt-2 text-2xl font-semibold text-amber-900">{delayedProjects.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <CardHeader
              title={text("Alertes operationnelles", "Operational alerts")}
              subtitle={text("Retards et programmes sous tension.", "Delays and programs under strain.")}
              action={<Badge tone="red">{overdueTasks.length + delayedProjects.length}</Badge>}
            />
            <div className="mt-4 space-y-3">
              {overdueTasks.slice(0, 3).map((task) => (
                <article key={task.id} className="rounded-xl border border-rose-100 bg-rose-50/60 p-3 text-sm text-rose-900">
                  <p className="font-semibold">{task.title}</p>
                  <p className="mt-1 text-rose-800/80">
                    {text("Projet", "Project")}: {task.project?.name} • {text("Responsable", "Assignee")}: {task.assignee?.fullName || text("Non assigne", "Unassigned")}
                  </p>
                </article>
              ))}
              {delayedProjects.slice(0, 3).map((project) => (
                <article key={project.id} className="rounded-xl border border-amber-100 bg-amber-50/60 p-3 text-sm text-amber-900">
                  <p className="font-semibold">{project.name}</p>
                  <p className="mt-1 text-amber-800/80">{text("Statut", "Status")}: {project.status}</p>
                </article>
              ))}
              {overdueTasks.length === 0 && delayedProjects.length === 0 ? (
                <p className="text-sm text-slate-500">{text("Aucune alerte operationnelle.", "No operational alerts.")}</p>
              ) : null}
            </div>
          </Card>

          <Card className="p-5">
            <CardHeader
              title={text("Acces rapide", "Quick access")}
              subtitle={text("Continuer le traitement depuis les modules dedies.", "Continue handling from dedicated modules.")}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <Link className="saas-btn saas-btn-subtle px-3 py-2 text-sm" to="/corrective-actions">
                {text("Suivi CAPA", "CAPA follow-up")}
              </Link>
              <Link className="saas-btn saas-btn-subtle px-3 py-2 text-sm" to="/dashboard">
                {text("Retour dashboard", "Back to dashboard")}
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
