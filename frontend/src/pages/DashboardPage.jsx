import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import api from "../api/client";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import { getErrorMessage } from "../utils/http";
import { useAuthStore } from "../store/authStore";
import { useUiStore } from "../store/uiStore";
import { t } from "../utils/i18n";
import { Card, CardHeader } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { Select } from "../components/ui/Input";
import ProjectProgress from "../components/projects/ProjectProgress";

const COLORS = ["#0f766e", "#d97706", "#1f2937"];
const KPI_COLORS = ["#16a34a", "#eab308", "#ef4444"];
const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid rgba(15, 23, 42, 0.08)",
  boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
  fontSize: 12,
};

export default function DashboardPage() {
  const [state, setState] = useState({ loading: true, error: "", data: null });
  const [period, setPeriod] = useState("month");
  const navigate = useNavigate();
  const user = useAuthStore((store) => store.user);
  const language = useUiStore((state) => state.language);
  const role = user?.role || "TEAM_MEMBER";
  const isProjectManager = role === "PROJECT_MANAGER";

  const text = (fr, en) => t(language, fr, en);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const endpoint = role === "TEAM_MEMBER" ? "/dashboard/my-overview" : "/dashboard/overview";
        const params = isProjectManager ? { period } : undefined;
        const { data } = await api.get(endpoint, { params });
        if (mounted) {
          setState({ loading: false, error: "", data: data.data });
        }
      } catch (error) {
        if (mounted) {
          setState({ loading: false, error: getErrorMessage(error), data: null });
        }
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [role, isProjectManager, period]);

  if (state.loading) return <div className="saas-card p-6">{text("Chargement du tableau de bord...", "Loading dashboard...")}</div>;
  if (state.error) return <div className="saas-card p-6 text-rose-700">{state.error}</div>;

  const { summary, taskStatusDistribution, projectProgress, kpis, requirementAssessments } = state.data;
  const pilotage = state.data?.pilotage;
  const recommendedPlan = pilotage?.recommendedPlan || [];
  const decisionHealth = pilotage?.decisionHealth || null;
  const doneTasks = taskStatusDistribution.find((item) => item.name === "Done")?.value || 0;
  const inProgressTasks = taskStatusDistribution.find((item) => item.name === "In Progress")?.value || 0;
  const todoTasks = taskStatusDistribution.find((item) => item.name === "Todo")?.value || 0;
  const globalCompletionRate =
    summary.totalTasks > 0 ? Math.round((doneTasks / summary.totalTasks) * 100) : 0;
  const openTasks = Math.max(summary.totalTasks - doneTasks, 0);

  const workloadSplit = [
    { name: "Completed", value: doneTasks },
    { name: "Open", value: openTasks },
  ];

  const projectStatusDistribution = [
    { name: "Delayed", value: projectProgress.filter((project) => project.status === "Delayed").length },
    { name: "At Risk", value: projectProgress.filter((project) => project.status === "At Risk").length },
    { name: "On Track", value: projectProgress.filter((project) => project.status === "On Track").length },
    { name: "Completed", value: projectProgress.filter((project) => project.status === "Completed").length },
  ];

  const kpiBandDistribution = [
    { name: "Strong (>=90%)", value: kpis.filter((kpi) => kpi.achievement >= 90).length },
    { name: "Watch (70-89%)", value: kpis.filter((kpi) => kpi.achievement >= 70 && kpi.achievement < 90).length },
    { name: "Critical (<70%)", value: kpis.filter((kpi) => kpi.achievement < 70).length },
  ];

  const topControlProjects = [...projectProgress]
    .sort((a, b) => a.progress - b.progress)
    .slice(0, 5)
    .map((project) => ({
      name: project.name,
      progress: project.progress,
      remaining: Math.max(project.totalTasks - project.doneTasks, 0),
    }));

  const delayedProjectsList = projectProgress.filter((project) => project.status === "Delayed");
  const atRiskProjects = projectProgress
    .filter((project) => project.status === "Delayed" || project.status === "At Risk")
    .sort((a, b) => a.progress - b.progress);
  const averageProjectProgress = projectProgress.length
    ? Math.round(projectProgress.reduce((sum, project) => sum + project.progress, 0) / projectProgress.length)
    : 0;
  const deliveryPressure = Math.min(100, Math.round((openTasks / Math.max(summary.totalTasks, 1)) * 100));
  const processAssessmentRows = requirementAssessments?.rows || [];
  const averageAssessmentScore = requirementAssessments?.averageScore || 0;
  const veracityDistribution = requirementAssessments?.veracityDistribution || [];

  const roleSubtitle = {
    ADMIN: text("Vue de gouvernance avec les signaux de qualite et de retard globaux.", "Governance view with global quality and delay signals."),
    PROJECT_MANAGER: text("Vue d'execution focalisee sur la livraison des projets et les goulots.", "Execution view focused on project delivery and bottlenecks."),
    TEAM_MEMBER: text("Vue personnelle focalisee sur le flux des taches et les priorites.", "Personal workbench view focused on task flow and priorities."),
  };
  const snapshotTime = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  return (
    <div className="space-y-4">
      <PageHeader
        title={text("Tableau de bord de pilotage executive", "Executive Pilotage Dashboard")}
        subtitle={roleSubtitle[role] || roleSubtitle.TEAM_MEMBER}
      />

      <section className="surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{text("Photo de controle", "Control Snapshot")}</p>
            <p className="mt-1 text-sm text-slate-700">{text("Vue de decision en temps reel synchronisee pour les revues de gouvernance et le suivi operationnel.", "Live decision view synchronized for governance reviews and operational follow-up.")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="blue">{text("Role", "Role")}: {role.replaceAll("_", " ")}</Badge>
            <Badge tone={summary.delayedProjects > 0 ? "amber" : "green"}>
              {text("Projets avec retard", "Delayed Projects")}: {summary.delayedProjects}
            </Badge>
            <Badge tone={summary.delayedTasks > 0 ? "red" : "green"}>{text("Taches avec retard", "Delayed Tasks")}: {summary.delayedTasks}</Badge>
            <Badge tone="slate">{text("Mise a jour", "Updated")}: {snapshotTime}</Badge>
          </div>
        </div>
      </section>

      {isProjectManager ? (
        <section className="saas-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-900">{text("Fenetre de temps du responsable", "Manager Time Window")}</p>
              <p className="text-xs text-slate-500">{text("Changer l'etendue de l'analyse pour les decisions de planification et de pilotage.", "Switch analysis scope for planning and steering decisions.")}</p>
            </div>
            <Select className="w-full sm:w-56" value={period} onChange={(event) => setPeriod(event.target.value)}>
              <option value="week">{text("7 derniers jours", "Last 7 days")}</option>
              <option value="month">{text("30 derniers jours", "Last 30 days")}</option>
              <option value="quarter">{text("90 derniers jours", "Last 90 days")}</option>
            </Select>
          </div>
        </section>
      ) : null}

      {role === "ADMIN" ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title={text("Total des projets", "Total Projects")} value={summary.totalProjects} tone="teal" />
          <StatCard title={text("Total des taches", "Total Tasks")} value={summary.totalTasks} />
          <StatCard title={text("Taches avec retard", "Delayed Tasks")} value={summary.delayedTasks} tone="red" />
          <StatCard title={text("Projets avec retard", "Delayed Projects")} value={summary.delayedProjects} tone="amber" />
        </section>
      ) : null}

      {isProjectManager ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title={text("Projets geres", "Managed Projects")} value={summary.totalProjects} tone="teal" />
          <StatCard title={text("Taches en cours", "In Progress Tasks")} value={inProgressTasks} />
          <StatCard title={text("Taches avec retard", "Delayed Tasks")} value={summary.delayedTasks} tone="red" />
          <StatCard title={text("Taux de completion", "Completion Rate")} value={`${globalCompletionRate}%`} tone="amber" hint={text(`Progression moyenne des projets: ${averageProjectProgress}%`, `Avg project progress: ${averageProjectProgress}%`)} />
        </section>
      ) : null}

      {isProjectManager ? (
        <section className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
          <Card className="p-5">
            <CardHeader title={text("Sante de la decision", "Decision Health")} subtitle={text("Score de pilotage composite pour l'examen de direction.", "Composite steering score for management review.")} />
            {decisionHealth ? (
              <>
                <div className="mt-2 flex items-end gap-3">
                  <p className="text-5xl font-semibold text-slate-900">{decisionHealth.score}</p>
                  <Badge tone={decisionHealth.level === "CRITICAL" ? "red" : decisionHealth.level === "AT_RISK" ? "amber" : decisionHealth.level === "WATCH" ? "blue" : "green"}>
                    {decisionHealth.level}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {text("KPIs sous-performants (<80%)", "Underperforming KPIs (<80%)")}: {decisionHealth.underperformingKpis}
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-500">{text("Score de decision non disponible.", "Decision score not available.")}</p>
            )}
          </Card>

          <Card className="p-5">
            <CardHeader title={text("Plan de pilotage recommande", "Recommended Steering Plan")} subtitle={text("Actions prioritisees generees a partir des signaux de risque en direct.", "Prioritized actions generated from live risk signals.")} />
            <div className="space-y-2">
              {recommendedPlan.length ? (
                recommendedPlan.map((item, index) => (
                  <article key={`${item.source}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">{item.action}</p>
                      <Badge tone={item.priority === "CRITICAL" ? "red" : item.priority === "HIGH" ? "amber" : item.priority === "MEDIUM" ? "blue" : "green"}>
                        {item.priority}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {text("Origine", "Source")}: {item.source}{item.correctiveActionId ? ` | CAPA: ${item.correctiveActionId}` : ""}
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-sm text-slate-500">{text("Aucune action recommandee pour le moment.", "No recommended action right now.")}</p>
              )}
            </div>
          </Card>
        </section>
      ) : null}

      {isProjectManager ? (
        <section className="grid gap-4 xl:grid-cols-3">
          <Card className="p-5">
            <CardHeader title={text("Pression de livraison", "Delivery Pressure")} subtitle={text("Part du volume de taches encore ouvert.", "Share of task volume still open.")} />
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-4xl font-semibold text-slate-900">{deliveryPressure}%</p>
              <Badge tone={deliveryPressure >= 65 ? "red" : deliveryPressure >= 45 ? "amber" : "green"}>
                {deliveryPressure >= 65 ? text("Eleve", "High") : deliveryPressure >= 45 ? text("Surveillance", "Watch") : text("Sain", "Healthy")}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {text("Taches ouvertes", "Open tasks")}: {openTasks} / {summary.totalTasks}
            </p>
          </Card>

          <Card className="p-5">
            <CardHeader title={text("Projets avec retard", "Delayed Projects")} subtitle={text("Projets qui necessitent une escalade immediate.", "Projects that need immediate escalation.")} />
            <p className="text-4xl font-semibold text-slate-900">{delayedProjectsList.length}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {delayedProjectsList.slice(0, 4).map((project) => (
                <Badge key={project.id} tone="red">{project.name}</Badge>
              ))}
              {delayedProjectsList.length === 0 ? <p className="text-sm text-slate-500">{text("Aucun projet avec retard pour le moment.", "No delayed project right now.")}</p> : null}
            </div>
          </Card>

          <Card className="p-5">
            <CardHeader title={text("Foyer d'execution", "Execution Focus")} subtitle={text("Projets a moins de 60% de completion ou en retard.", "Projects under 60% completion or delayed.")} />
            <p className="text-4xl font-semibold text-slate-900">{atRiskProjects.length}</p>
            <p className="mt-2 text-sm text-slate-500">
              {text("Prioriser le suivi du proprietaire et l'examen de la CAPA sur ces projets.", "Prioritize owner follow-up and CAPA review on these projects.")}
            </p>
          </Card>
        </section>
      ) : null}

      {role === "TEAM_MEMBER" ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title={text("Ma file (A faire)", "My Queue (Todo)")} value={todoTasks} tone="amber" />
          <StatCard title={text("En cours", "In Progress")} value={inProgressTasks} tone="teal" />
          <StatCard title={text("Termine", "Completed")} value={doneTasks} />
          <StatCard title={text("Alertes en retard", "Overdue Alerts")} value={summary.delayedTasks} tone="red" />
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="p-0">
          <div className="p-5 pb-1">
            <CardHeader title={text("Distribution du statut des taches", "Task Status Distribution")} subtitle={text("Vue rapide du flux d'execution.", "Quick view of execution flow.")} />
          </div>
          <div className="h-72 px-4 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={taskStatusDistribution} dataKey="value" nameKey="name" outerRadius={100}>
                  {taskStatusDistribution.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-0">
          <div className="p-5 pb-1">
            <CardHeader title={text("Progression du projet", "Project Progress")} subtitle={text("Pourcentage de completion par projet.", "Completion percentage by project.")} />
          </div>
          <div className="h-72 px-4 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectProgress}>
                <CartesianGrid strokeDasharray="2 4" stroke="#e2e8f0" />
                <XAxis dataKey="name" hide />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="progress" fill="#0f766e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      {role !== "TEAM_MEMBER" ? (
        <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="p-5">
            <CardHeader
              title={text("Maturite des exigences ISO", "ISO Requirements Maturity")}
              subtitle={text("Moyenne globale des taux de véracité/conformité saisis par processus.", "Global average of requirement truth/compliance rates entered per process.")}
            />
            <div className="mt-2 flex items-end gap-3">
              <p className="text-5xl font-semibold text-slate-900">{averageAssessmentScore}%</p>
              <Badge tone={averageAssessmentScore >= 80 ? "green" : averageAssessmentScore >= 60 ? "amber" : "red"}>
                {averageAssessmentScore >= 80 ? text("Maitrise", "Controlled") : averageAssessmentScore >= 60 ? text("A renforcer", "Needs Work") : text("Critique", "Critical")}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {text("Processus evalúes", "Assessed processes")}: {processAssessmentRows.filter((row) => row.assessedRequirements > 0).length} / {processAssessmentRows.length}
            </p>
          </Card>

          <Card className="p-0">
            <div className="p-5 pb-1">
              <CardHeader
                title={text("Taux global par processus", "Overall Score by Process")}
                subtitle={text("Repérez les processus les moins alignés sur les exigences ISO.", "Identify the processes least aligned with ISO requirements.")}
              />
            </div>
            <div className="h-72 px-4 pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processAssessmentRows} onClick={(payload) => {
                  const processId = payload?.activePayload?.[0]?.payload?.processId;
                  if (processId) {
                    navigate(`/processes/${processId}`);
                  }
                }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#e2e8f0" />
                  <XAxis dataKey="processName" hide />
                  <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="overallScore" fill="#0f766e" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </section>
      ) : null}

      {role !== "TEAM_MEMBER" ? (
        <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="p-5">
            <CardHeader
              title={text("Répartition de la véracité", "Veracity Distribution")}
              subtitle={text("Lecture qualitative globale des fiches d'exigences remplies.", "Global qualitative reading of completed requirement sheets.")}
            />
            <div className="mt-3 space-y-2">
              {veracityDistribution.map((item) => (
                <div key={item.value} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                  <span className="text-sm text-slate-700">{item.label}</span>
                  <Badge tone={item.value === "TRUE" ? "green" : item.value === "RATHER_TRUE" ? "blue" : item.value === "RATHER_FALSE" ? "amber" : "red"}>
                    {item.count}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-0">
            <div className="p-5 pb-1">
              <CardHeader
                title={text("Niveaux de véracité", "Veracity Levels")}
                subtitle={text("Distribution des niveaux Faux à Vrai dans les évaluations.", "Distribution of levels from False to True across evaluations.")}
              />
            </div>
            <div className="h-72 px-4 pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={veracityDistribution}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {veracityDistribution.map((item) => (
                      <Cell
                        key={item.value}
                        fill={
                          item.value === "TRUE"
                            ? "#16a34a"
                            : item.value === "RATHER_TRUE"
                              ? "#0f766e"
                              : item.value === "RATHER_FALSE"
                                ? "#d97706"
                                : "#dc2626"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </section>
      ) : null}

      {isProjectManager ? (
        <section className="saas-card p-5">
          <CardHeader title={text("Tableau de commande des actions du responsable", "Manager Action Board")} subtitle={text("Controle complet projet par projet pour l'examen hebdomadaire.", "Comprehensive project-by-project control for weekly review.")} />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-2">{text("Projet", "Project")}</th>
                  <th className="py-2">{text("Statut", "Status")}</th>
                  <th className="py-2">{text("Progression", "Progress")}</th>
                  <th className="py-2">{text("Fait / Total", "Done / Total")}</th>
                  <th className="py-2">{text("Priorite", "Priority")}</th>
                </tr>
              </thead>
              <tbody>
                {projectProgress
                  .slice()
                  .sort((a, b) => a.progress - b.progress)
                  .map((project) => {
                    const priorityTone =
                      project.status === "Delayed" || project.progress < 50
                        ? "red"
                        : project.status === "At Risk" || project.progress < 75
                          ? "amber"
                          : "green";
                    const priorityLabel =
                      project.status === "Delayed" || project.progress < 50
                        ? text("Escalade", "Escalate")
                        : project.status === "At Risk" || project.progress < 75
                          ? text("Suivi", "Track")
                          : text("Stable", "Stable");

                    return (
                      <tr key={project.id} className="border-t border-slate-200">
                        <td className="py-2 text-slate-900">{project.name}</td>
                        <td className="py-2">
                          <Badge tone={project.status === "Delayed" ? "red" : project.status === "At Risk" ? "amber" : project.status === "Completed" ? "green" : "blue"}>
                            {project.status}
                          </Badge>
                        </td>
                        <td className="py-2 text-slate-700">
                          <ProjectProgress
                            progress={project.progress}
                            status={project.status}
                            completedTasks={project.doneTasks}
                            totalTasks={project.totalTasks}
                          />
                        </td>
                        <td className="py-2 text-slate-700">{project.doneTasks} / {project.totalTasks}</td>
                        <td className="py-2">
                          <Badge tone={priorityTone}>{priorityLabel}</Badge>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="p-0">
          <div className="p-5 pb-1">
            <CardHeader title={text("Jauge de completion", "Completion Gauge")} subtitle={text("Ratio de completion d'execution actuelle.", "Current execution completion ratio.")} />
          </div>
          <div className="h-64 px-2 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="70%"
                outerRadius="100%"
                barSize={14}
                data={[{ name: text("Completion", "Completion"), value: globalCompletionRate }]}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar dataKey="value" cornerRadius={8} fill="#0f766e" />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#0f172a" fontSize={24} fontWeight={600}>
                  {`${globalCompletionRate}%`}
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-0">
          <div className="p-5 pb-1">
            <CardHeader title={text("Melange du statut du projet", "Project Status Mix")} subtitle={text("Distribution par statut du cycle de vie.", "Distribution by lifecycle status.")} />
          </div>
          <div className="h-64 px-4 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={projectStatusDistribution} dataKey="value" nameKey="name" outerRadius={88}>
                  {projectStatusDistribution.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-0">
          <div className="p-5 pb-1">
            <CardHeader title={text("Repartition du travail", "Workload Split")} subtitle={text("Volume de taches ouvertes par rapport aux taches terminees.", "Open versus completed task volume.")} />
          </div>
          <div className="h-64 px-4 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadSplit}>
                <CartesianGrid strokeDasharray="2 4" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  <Cell fill="#0f766e" />
                  <Cell fill="#d97706" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="p-0">
          <div className="p-5 pb-1">
            <CardHeader title={text("Projets de priorite de controle", "Control Priority Projects")} subtitle={text("Projets avec la progression la plus basse necessitant une intervention.", "Lowest progress projects needing intervention.")} />
          </div>
          <div className="h-72 px-4 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topControlProjects} layout="vertical">
                <CartesianGrid strokeDasharray="2 4" stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="progress" fill="#0f766e" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {role !== "TEAM_MEMBER" ? (
          <Card className="p-0">
            <div className="p-5 pb-1">
              <CardHeader title={text("Bandes de performance KPI", "KPI Performance Bands")} subtitle={text("Distribution du controle entre les bandes de qualite des KPI.", "Control distribution across KPI quality bands.")} />
            </div>
            <div className="h-72 px-4 pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={kpiBandDistribution} dataKey="value" nameKey="name" outerRadius={94}>
                    {kpiBandDistribution.map((entry, index) => (
                      <Cell key={entry.name} fill={KPI_COLORS[index % KPI_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        ) : (
          <Card className="p-0">
            <div className="p-5 pb-1">
              <CardHeader title={text("Foyer d'execution personnelle", "Personal Execution Focus")} subtitle={text("Progression du projet pour le domaine assigne.", "Project-by-project progress on assigned scope.")} />
            </div>
            <div className="h-72 px-4 pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectProgress}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#e2e8f0" />
                  <XAxis dataKey="name" hide />
                  <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="progress" fill="#0f766e" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </section>

      {role !== "TEAM_MEMBER" ? (
        <section className="saas-card p-5">
          <CardHeader title={isProjectManager ? text("Indicateurs KPI (Vue responsable)", "KPI Indicators (Manager View)") : text("Indicateurs KPI", "KPI Indicators")} subtitle={isProjectManager ? text("Cibles au niveau du processus, pour soutenir le pilotage du projet et la prioritarisation des CAPA.", "Process-level targets, to support project steering and CAPA prioritization.") : text("Cibles et dotations au niveau du processus.", "Process-level targets and attainment.")} />
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-2">{text("Processus", "Process")}</th>
                  <th className="py-2">{text("Indicateur", "Indicator")}</th>
                  <th className="py-2">{text("Actuel", "Current")}</th>
                  <th className="py-2">{text("Cible", "Target")}</th>
                  <th className="py-2">{text("Realisation", "Achievement")}</th>
                </tr>
              </thead>
              <tbody>
                {kpis.map((row) => (
                  <tr key={`${row.processName}-${row.indicatorName}`} className="border-t border-slate-200">
                    <td className="py-2">{row.processName}</td>
                    <td className="py-2">{row.indicatorName}</td>
                    <td className="py-2">{row.current}</td>
                    <td className="py-2">{row.target}</td>
                    <td className="py-2">
                      <Badge tone={row.achievement >= 90 ? "green" : row.achievement >= 70 ? "amber" : "red"}>
                        {row.achievement}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {role !== "TEAM_MEMBER" ? (
        <section className="saas-card p-5">
          <CardHeader
            title={text("Synthese des exigences par processus", "Requirement Summary by Process")}
            subtitle={text("Suivi du taux global et du nombre d'exigences renseignées pour chaque processus.", "Track the overall score and number of completed requirement entries for each process.")}
          />
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-2">{text("Processus", "Process")}</th>
                  <th className="py-2">{text("Taux global", "Overall Score")}</th>
                  <th className="py-2">{text("Véracité dominante", "Dominant Veracity")}</th>
                  <th className="py-2">{text("Exigences remplies", "Completed Requirements")}</th>
                  <th className="py-2">{text("Derniere mise a jour", "Last Update")}</th>
                </tr>
              </thead>
              <tbody>
                {processAssessmentRows.map((row) => (
                  <tr key={row.processId} className="border-t border-slate-200">
                    <td className="py-2">
                      <Link className="font-medium text-emerald-700 hover:text-emerald-800" to={`/processes/${row.processId}`}>
                        {row.processName}
                      </Link>
                    </td>
                    <td className="py-2">
                      <Badge tone={row.overallScore >= 80 ? "green" : row.overallScore >= 60 ? "amber" : "red"}>
                        {row.overallScore}%
                      </Badge>
                    </td>
                    <td className="py-2">
                      <Badge
                        tone={
                          row.dominantVeracityLevel === "TRUE"
                            ? "green"
                            : row.dominantVeracityLevel === "RATHER_TRUE"
                              ? "blue"
                              : row.dominantVeracityLevel === "RATHER_FALSE"
                                ? "amber"
                                : "red"
                        }
                      >
                        {row.dominantVeracityLabel}
                      </Badge>
                    </td>
                    <td className="py-2">{row.assessedRequirements} / {row.totalRequirements}</td>
                    <td className="py-2 text-slate-600">
                      {row.lastUpdatedAt ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(row.lastUpdatedAt)) : text("Jamais", "Never")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="saas-card p-5">
          <CardHeader title={text("Conseil d'execution", "Execution Hint")} subtitle={text("Gardez votre tableau personnel sain et previsible.", "Keep your personal board healthy and predictable.")} />
          <p className="mt-2 text-sm text-slate-600">
            {text("Concentrez-vous sur le deplacement des taches de A faire a Fait et gardez les alertes en retard a zero.", "Focus on moving tasks from Todo to Done and keep overdue alerts at zero.")}
          </p>
        </section>
      )}
    </div>
  );
}
