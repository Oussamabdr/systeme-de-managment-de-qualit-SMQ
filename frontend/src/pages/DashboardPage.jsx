import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  FolderKanban,
  Gauge,
  MessageSquareWarning,
  ShieldAlert,
} from "lucide-react";
import api from "../api/client";
import PageHeader from "../components/ui/PageHeader";
import { getErrorMessage } from "../utils/http";
import { useAuthStore } from "../store/authStore";
import { useUiStore } from "../store/uiStore";
import { t } from "../utils/i18n";
import { Card, CardHeader } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { Select } from "../components/ui/Input";

const severityRank = { critical: 5, high: 4, medium: 3, low: 2, good: 1 };
const chartColors = ["#0f766e", "#d97706", "#dc2626", "#2563eb", "#475569"];
const tooltipStyle = {
  borderRadius: 8,
  border: "1px solid rgba(15, 23, 42, 0.12)",
  fontSize: 12,
};

function toneForSeverity(severity) {
  if (severity === "critical") return "red";
  if (severity === "high" || severity === "medium") return "amber";
  return "green";
}

function getTaskCount(distribution, name) {
  return distribution.find((item) => item.name === name)?.value || 0;
}

function roleLabel(role, text) {
  const labels = {
    ADMIN: text("Direction Generale Qualite", "Quality Executive Office"),
    PROJECT_MANAGER: text("Responsable projet", "Project Manager"),
    TEAM_MEMBER: text("Membre equipe", "Team Member"),
    CAQ: "CAQ",
  };
  return labels[role] || role?.replaceAll("_", " ");
}

function buildPriorityIndicators(data, role, text) {
  const {
    summary,
    taskStatusDistribution,
    projectProgress,
    kpis,
    requirementAssessments,
    resourceMonitoring,
    correctiveActions,
    pilotage,
  } = data;

  const doneTasks = getTaskCount(taskStatusDistribution, "Done");
  const inProgressTasks = getTaskCount(taskStatusDistribution, "In Progress");
  const completion = summary.totalTasks ? Math.round((doneTasks / summary.totalTasks) * 100) : 0;
  const openTasks = Math.max(summary.totalTasks - doneTasks, 0);
  const delayedProjects = projectProgress.filter((project) => project.status === "Delayed");
  const weakProcesses = requirementAssessments?.rows?.filter((row) => row.overallScore < 60) || [];
  const weakKpis = (kpis || []).filter((kpi) => kpi.achievement < 80);
  const openCriticalCapa = correctiveActions?.bySeverity?.CRITICAL || 0;
  const decisionScore = pilotage?.decisionHealth?.score ?? 100;

  const allIndicators = [
    {
      id: "delayed-projects",
      label: text("Projets en retard", "Delayed projects"),
      value: summary.delayedProjects,
      detail: delayedProjects[0]?.name || text("Aucun projet critique", "No critical project"),
      severity: summary.delayedProjects > 2 ? "critical" : summary.delayedProjects > 0 ? "high" : "good",
      priority: summary.delayedProjects > 0 ? 96 + summary.delayedProjects : 18,
      icon: FolderKanban,
      path: role === "TEAM_MEMBER" ? "/tasks" : "/projects",
      source: "DELAYED_PROJECT",
    },
    {
      id: "overdue-tasks",
      label: text("Taches en retard", "Overdue tasks"),
      value: summary.delayedTasks,
      detail: text(`${openTasks} taches ouvertes`, `${openTasks} open tasks`),
      severity: summary.delayedTasks > 5 ? "critical" : summary.delayedTasks > 0 ? "high" : "good",
      priority: summary.delayedTasks > 0 ? 92 + summary.delayedTasks : 22,
      icon: ClipboardList,
      path: "/tasks",
      source: "OVERDUE_TASK",
    },
    {
      id: "decision-health",
      label: text("Sante de decision", "Decision health"),
      value: `${decisionScore}%`,
      detail: pilotage?.decisionHealth?.level || "GOOD",
      severity: decisionScore < 40 ? "critical" : decisionScore < 60 ? "high" : decisionScore < 80 ? "medium" : "good",
      priority: decisionScore < 80 ? 88 + (100 - decisionScore) / 5 : 30,
      icon: Gauge,
      path: role === "TEAM_MEMBER" ? "/tasks" : "/corrective-actions",
      source: "MANUAL",
    },
    {
      id: "critical-capa",
      label: text("CAPA critiques", "Critical CAPA"),
      value: openCriticalCapa,
      detail: text("Actions ouvertes a verifier", "Open actions to verify"),
      severity: openCriticalCapa > 0 ? "critical" : "good",
      priority: openCriticalCapa > 0 ? 86 + openCriticalCapa : 16,
      icon: ShieldAlert,
      path: role === "TEAM_MEMBER" ? "/tasks" : "/corrective-actions",
      source: "MANUAL",
    },
    {
      id: "iso-maturity",
      label: text("Maturite ISO", "ISO maturity"),
      value: `${requirementAssessments?.averageScore || 0}%`,
      detail: weakProcesses[0]?.processName || text("Processus maitrises", "Processes controlled"),
      severity:
        (requirementAssessments?.averageScore || 0) < 60
          ? "critical"
          : (requirementAssessments?.averageScore || 0) < 80
            ? "medium"
            : "good",
      priority: role !== "TEAM_MEMBER" && (requirementAssessments?.averageScore || 0) < 80 ? 82 : 14,
      icon: BarChart3,
      path: "/processes",
      source: "KPI_DEVIATION",
    },
    {
      id: "kpi-gap",
      label: text("KPI sous objectif", "KPIs under target"),
      value: weakKpis.length,
      detail: weakKpis[0]?.indicatorName || text("Objectifs tenus", "Targets held"),
      severity: weakKpis.length > 3 ? "critical" : weakKpis.length > 0 ? "medium" : "good",
      priority: role !== "TEAM_MEMBER" && weakKpis.length > 0 ? 78 + weakKpis.length : 12,
      icon: AlertTriangle,
      path: "/processes",
      source: "KPI_DEVIATION",
    },
    {
      id: "completion",
      label: text("Completion globale", "Overall completion"),
      value: `${completion}%`,
      detail: text(`${doneTasks} terminees, ${inProgressTasks} en cours`, `${doneTasks} done, ${inProgressTasks} in progress`),
      severity: completion < 50 ? "high" : completion < 75 ? "medium" : "good",
      priority: completion < 75 ? 66 + (75 - completion) / 3 : 20,
      icon: CheckCircle2,
      path: role === "TEAM_MEMBER" ? "/tasks" : "/projects",
      source: "MANUAL",
    },
    {
      id: "resource-variance",
      label: text("Ecart ressources", "Resource variance"),
      value: `${resourceMonitoring?.variancePercent || 0}%`,
      detail: text("Reel vs planifie", "Actual vs planned"),
      severity:
        (resourceMonitoring?.variancePercent || 0) > 30
          ? "critical"
          : (resourceMonitoring?.variancePercent || 0) > 15
            ? "high"
            : "good",
      priority: (resourceMonitoring?.variancePercent || 0) > 15 ? 74 + resourceMonitoring.variancePercent / 2 : 10,
      icon: Gauge,
      path: "/tasks",
      source: "MANUAL",
    },
  ];

  return allIndicators
    .filter((indicator) => role !== "TEAM_MEMBER" || !["iso-maturity", "kpi-gap"].includes(indicator.id))
    .sort((a, b) => b.priority - a.priority || severityRank[b.severity] - severityRank[a.severity])
    .slice(0, 5);
}

export default function DashboardPage() {
  const [state, setState] = useState({ loading: true, error: "", data: null });
  const [period, setPeriod] = useState("month");
  const [reportTarget, setReportTarget] = useState(null);
  const [reportForm, setReportForm] = useState({
    comment: "",
    impact: "",
    requestedAction: "",
    reportType: "ESCALATION",
    includeCharts: true,
  });
  const [reportStatus, setReportStatus] = useState({ saving: false, error: "", success: "" });
  const navigate = useNavigate();
  const user = useAuthStore((store) => store.user);
  const language = useUiStore((state) => state.language);
  const role = user?.role || "TEAM_MEMBER";
  const canUsePeriod = role === "PROJECT_MANAGER";
  const canReport = ["PROJECT_MANAGER", "TEAM_MEMBER", "CAQ"].includes(role);
  const text = (fr, en) => t(language, fr, en);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const endpoint = role === "TEAM_MEMBER" ? "/dashboard/my-overview" : "/dashboard/overview";
        const params = canUsePeriod ? { period } : undefined;
        const { data } = await api.get(endpoint, { params });
        if (mounted) setState({ loading: false, error: "", data: data.data });
      } catch (error) {
        if (mounted) setState({ loading: false, error: getErrorMessage(error), data: null });
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [role, canUsePeriod, period]);

  const indicators = state.data ? buildPriorityIndicators(state.data, role, text) : [];

  async function submitReport(event) {
    event.preventDefault();
    if (!reportTarget) return;

    setReportStatus({ saving: true, error: "", success: "" });
    try {
      await api.post("/dashboard/report", {
        title: reportTarget.label,
        comment: reportForm.comment,
        impact: reportForm.impact,
        requestedAction: reportForm.requestedAction,
        reportType: reportForm.reportType,
        includeCharts: reportForm.includeCharts,
        chartContext: reportForm.includeCharts ? indicators.map(({ label, value, severity }) => ({ label, value: String(value), severity })) : [],
        severity:
          reportTarget.severity === "critical"
            ? "CRITICAL"
            : reportTarget.severity === "high"
              ? "HIGH"
              : reportTarget.severity === "medium"
                ? "MEDIUM"
                : "LOW",
        source: reportTarget.source,
        targetPath: reportTarget.path,
      });
      setReportForm({ comment: "", impact: "", requestedAction: "", reportType: "ESCALATION", includeCharts: true });
      setReportTarget(null);
      setReportStatus({ saving: false, error: "", success: text("Rapport envoye.", "Report sent.") });
    } catch (error) {
      setReportStatus({ saving: false, error: getErrorMessage(error), success: "" });
    }
  }

  if (state.loading) return <div className="saas-card p-6">{text("Chargement du tableau de bord...", "Loading dashboard...")}</div>;
  if (state.error) return <div className="saas-card p-6 text-rose-700">{state.error}</div>;

  const taskChartData = state.data.taskStatusDistribution;
  const projectChartData = state.data.projectProgress
    .slice()
    .sort((a, b) => a.progress - b.progress)
    .slice(0, 6)
    .map((project) => ({ name: project.name, progress: project.progress }));
  const reportChartData = indicators.map((indicator) => ({
    name: indicator.label,
    priority: Math.round(indicator.priority),
  }));

  return (
    <div className="dashboard-screen space-y-3">
      <PageHeader
        title={text("Tableau de bord", "Dashboard")}
        subtitle={text(
          "Les cinq indicateurs les plus importants changent automatiquement selon les risques actifs.",
          "The five most important indicators change automatically as risks appear.",
        )}
      />

      <section className="surface p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Badge tone="blue">{text("Role", "Role")}: {roleLabel(role, text)}</Badge>
            <Badge tone="slate">{text("Indicateurs affiches", "Shown indicators")}: 5</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canUsePeriod ? (
              <Select className="w-44" value={period} onChange={(event) => setPeriod(event.target.value)}>
                <option value="week">{text("7 jours", "7 days")}</option>
                <option value="month">{text("30 jours", "30 days")}</option>
                <option value="quarter">{text("90 jours", "90 days")}</option>
              </Select>
            ) : null}
            <Link className="saas-btn saas-btn-subtle" to={role === "TEAM_MEMBER" ? "/tasks" : "/notifications"}>
              {text("Voir details", "View details")}
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-5">
        {indicators.map((indicator) => {
          const Icon = indicator.icon;
          const tone = toneForSeverity(indicator.severity);
          return (
            <button
              key={indicator.id}
              type="button"
              className={`group saas-card min-h-52 p-4 text-left transition-all duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 stat-${tone === "red" ? "red" : tone === "amber" ? "amber" : "teal"}`}
              title={text("Cliquer pour ouvrir la partie concernee.", "Click to open the related area.")}
              onClick={() => navigate(indicator.path)}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 group-hover:text-emerald-700">
                  <Icon size={18} />
                </span>
                <Badge tone={tone}>{indicator.severity.toUpperCase()}</Badge>
              </div>
              <p className="mt-4 text-xs uppercase tracking-[0.12em] opacity-75">{indicator.label}</p>
              <p className="mt-2 text-4xl font-semibold leading-none">{indicator.value}</p>
              <p className="mt-3 line-clamp-2 text-sm text-slate-600">{indicator.detail}</p>
              <p className="mt-4 text-xs font-medium text-emerald-700 opacity-0 transition-opacity group-hover:opacity-100">
                {text("Ouvrir la section", "Open section")}
              </p>
            </button>
          );
        })}
      </section>

      <section className="grid gap-3 lg:grid-cols-[1fr_1.25fr]">
        <Card className="p-4">
          <CardHeader
            title={text("Reporting", "Reporting")}
            subtitle={text(
              "Managers et membres peuvent remonter un point avec commentaire vers le role le plus eleve.",
              "Managers and members can escalate an item with a comment to the highest role.",
            )}
          />
          {canReport ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {indicators.map((indicator) => (
                <Button
                  key={indicator.id}
                  type="button"
                  variant={reportTarget?.id === indicator.id ? "primary" : "subtle"}
                  className="gap-2 px-3 py-2 text-xs"
                  onClick={() => {
                    setReportTarget(indicator);
                    setReportStatus({ saving: false, error: "", success: "" });
                  }}
                >
                  <MessageSquareWarning size={14} />
                  {indicator.label}
                </Button>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">{text("Les rapports recus apparaissent dans les actions CAPA.", "Received reports appear in CAPA actions.")}</p>
          )}
          {reportStatus.success ? <p className="mt-3 text-sm text-green-700">{reportStatus.success}</p> : null}
        </Card>

        {canReport && reportTarget ? (
          <Card className="p-4">
            <CardHeader title={reportTarget.label} subtitle={text("Ajouter un commentaire avant envoi.", "Add a comment before sending.")} />
            <form className="mt-3 space-y-3" onSubmit={submitReport}>
              <div className="grid gap-2 sm:grid-cols-2">
                <Select
                  value={reportForm.reportType}
                  onChange={(event) => setReportForm((prev) => ({ ...prev, reportType: event.target.value }))}
                >
                  <option value="ESCALATION">{text("Escalade", "Escalation")}</option>
                  <option value="REQUEST_SUPPORT">{text("Demande support", "Support request")}</option>
                  <option value="STATUS_UPDATE">{text("Point statut", "Status update")}</option>
                  <option value="RISK_NOTE">{text("Note risque", "Risk note")}</option>
                </Select>
                <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={reportForm.includeCharts}
                    onChange={(event) => setReportForm((prev) => ({ ...prev, includeCharts: event.target.checked }))}
                  />
                  {text("Inclure les graphes", "Include charts")}
                </label>
              </div>
              <textarea
                className="saas-input min-h-24 resize-none"
                value={reportForm.comment}
                onChange={(event) => setReportForm((prev) => ({ ...prev, comment: event.target.value }))}
                placeholder={text("Decrire le blocage, l'impact et l'aide attendue.", "Describe the blocker, impact, and support needed.")}
                required
              />
              <textarea
                className="saas-input min-h-18 resize-none"
                value={reportForm.impact}
                onChange={(event) => setReportForm((prev) => ({ ...prev, impact: event.target.value }))}
                placeholder={text("Impact sur le projet, processus, delai ou qualite.", "Impact on project, process, deadline, or quality.")}
              />
              <textarea
                className="saas-input min-h-18 resize-none"
                value={reportForm.requestedAction}
                onChange={(event) => setReportForm((prev) => ({ ...prev, requestedAction: event.target.value }))}
                placeholder={text("Decision ou support attendu.", "Decision or support requested.")}
              />
              {reportForm.includeCharts ? (
                <div className="h-32 rounded-lg border border-slate-200 p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportChartData}>
                      <XAxis dataKey="name" hide />
                      <YAxis hide />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="priority" fill="#0f766e" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : null}
              {reportStatus.error ? <p className="text-sm text-rose-700">{reportStatus.error}</p> : null}
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setReportTarget(null)}>
                  {text("Annuler", "Cancel")}
                </Button>
                <Button type="submit" disabled={reportStatus.saving}>
                  {reportStatus.saving ? text("Envoi...", "Sending...") : text("Envoyer le rapport", "Send report")}
                </Button>
              </div>
            </form>
          </Card>
        ) : (
          <Card className="p-4">
            <CardHeader title={text("Acces aux details", "Detail access")} subtitle={text("Les autres donnees restent disponibles dans les modules dedies.", "Other data stays available in the dedicated modules.")} />
            <div className="mt-3 flex flex-wrap gap-2">
              <Link className="saas-btn saas-btn-subtle" to="/tasks">{text("Taches", "Tasks")}</Link>
              {role !== "TEAM_MEMBER" ? <Link className="saas-btn saas-btn-subtle" to="/projects">{text("Projets", "Projects")}</Link> : null}
              {role !== "TEAM_MEMBER" ? <Link className="saas-btn saas-btn-subtle" to="/processes">{text("Processus", "Processes")}</Link> : null}
              {role !== "TEAM_MEMBER" ? <Link className="saas-btn saas-btn-subtle" to="/corrective-actions">CAPA</Link> : null}
            </div>
          </Card>
        )}
      </section>

      {canReport && reportTarget ? (
        <section className="grid gap-3 lg:grid-cols-2">
          <Card className="p-4">
            <CardHeader
              title={text("Details d'execution", "Execution details")}
              subtitle={text("Vue graphique des taches et de la progression.", "Graph view of tasks and progress.")}
            />
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={taskChartData} dataKey="value" nameKey="name" outerRadius={72}>
                      {taskChartData.map((item, index) => (
                        <Cell key={item.name} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectChartData}>
                    <CartesianGrid strokeDasharray="2 4" stroke="#e2e8f0" />
                    <XAxis dataKey="name" hide />
                    <YAxis width={28} tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="progress" fill="#0f766e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <CardHeader
              title={text("Reporting graphique", "Reporting graph")}
              subtitle={text("Priorite relative des cinq indicateurs actifs.", "Relative priority of the five active indicators.")}
            />
            <div className="mt-3 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="2 4" stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="priority" fill="#d97706" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
