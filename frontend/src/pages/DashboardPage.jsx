import { useEffect, useState } from "react";
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
  const user = useAuthStore((store) => store.user);
  const role = user?.role || "TEAM_MEMBER";
  const isProjectManager = role === "PROJECT_MANAGER";

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

  if (state.loading) return <div className="saas-card p-6">Loading dashboard...</div>;
  if (state.error) return <div className="saas-card p-6 text-rose-700">{state.error}</div>;

  const { summary, taskStatusDistribution, projectProgress, kpis } = state.data;
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

  const roleSubtitle = {
    ADMIN: "Governance view with global quality and delay signals.",
    PROJECT_MANAGER: "Execution view focused on project delivery and bottlenecks.",
    TEAM_MEMBER: "Personal workbench view focused on task flow and priorities.",
  };
  const snapshotTime = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  return (
    <div className="space-y-4">
      <PageHeader
        title="Executive Pilotage Dashboard"
        subtitle={roleSubtitle[role] || roleSubtitle.TEAM_MEMBER}
      />

      <section className="surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Control Snapshot</p>
            <p className="mt-1 text-sm text-slate-700">Live decision view synchronized for governance reviews and operational follow-up.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="blue">Role: {role.replaceAll("_", " ")}</Badge>
            <Badge tone={summary.delayedProjects > 0 ? "amber" : "green"}>
              Delayed Projects: {summary.delayedProjects}
            </Badge>
            <Badge tone={summary.delayedTasks > 0 ? "red" : "green"}>Delayed Tasks: {summary.delayedTasks}</Badge>
            <Badge tone="slate">Updated: {snapshotTime}</Badge>
          </div>
        </div>
      </section>

      {isProjectManager ? (
        <section className="saas-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-900">Manager Time Window</p>
              <p className="text-xs text-slate-500">Switch analysis scope for planning and steering decisions.</p>
            </div>
            <Select className="w-full sm:w-56" value={period} onChange={(event) => setPeriod(event.target.value)}>
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="quarter">Last 90 days</option>
            </Select>
          </div>
        </section>
      ) : null}

      {role === "ADMIN" ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total Projects" value={summary.totalProjects} tone="teal" />
          <StatCard title="Total Tasks" value={summary.totalTasks} />
          <StatCard title="Delayed Tasks" value={summary.delayedTasks} tone="red" />
          <StatCard title="Delayed Projects" value={summary.delayedProjects} tone="amber" />
        </section>
      ) : null}

      {isProjectManager ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Managed Projects" value={summary.totalProjects} tone="teal" />
          <StatCard title="In Progress Tasks" value={inProgressTasks} />
          <StatCard title="Delayed Tasks" value={summary.delayedTasks} tone="red" />
          <StatCard title="Completion Rate" value={`${globalCompletionRate}%`} tone="amber" hint={`Avg project progress: ${averageProjectProgress}%`} />
        </section>
      ) : null}

      {isProjectManager ? (
        <section className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
          <Card className="p-5">
            <CardHeader title="Decision Health" subtitle="Composite steering score for management review." />
            {decisionHealth ? (
              <>
                <div className="mt-2 flex items-end gap-3">
                  <p className="text-5xl font-semibold text-slate-900">{decisionHealth.score}</p>
                  <Badge tone={decisionHealth.level === "CRITICAL" ? "red" : decisionHealth.level === "AT_RISK" ? "amber" : decisionHealth.level === "WATCH" ? "blue" : "green"}>
                    {decisionHealth.level}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Underperforming KPIs (&lt;80%): {decisionHealth.underperformingKpis}
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-500">Decision score not available.</p>
            )}
          </Card>

          <Card className="p-5">
            <CardHeader title="Recommended Steering Plan" subtitle="Prioritized actions generated from live risk signals." />
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
                      Source: {item.source}{item.correctiveActionId ? ` | CAPA: ${item.correctiveActionId}` : ""}
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-sm text-slate-500">No recommended action right now.</p>
              )}
            </div>
          </Card>
        </section>
      ) : null}

      {isProjectManager ? (
        <section className="grid gap-4 xl:grid-cols-3">
          <Card className="p-5">
            <CardHeader title="Delivery Pressure" subtitle="Share of task volume still open." />
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-4xl font-semibold text-slate-900">{deliveryPressure}%</p>
              <Badge tone={deliveryPressure >= 65 ? "red" : deliveryPressure >= 45 ? "amber" : "green"}>
                {deliveryPressure >= 65 ? "High" : deliveryPressure >= 45 ? "Watch" : "Healthy"}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Open tasks: {openTasks} / {summary.totalTasks}
            </p>
          </Card>

          <Card className="p-5">
            <CardHeader title="Delayed Projects" subtitle="Projects that need immediate escalation." />
            <p className="text-4xl font-semibold text-slate-900">{delayedProjectsList.length}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {delayedProjectsList.slice(0, 4).map((project) => (
                <Badge key={project.id} tone="red">{project.name}</Badge>
              ))}
              {delayedProjectsList.length === 0 ? <p className="text-sm text-slate-500">No delayed project right now.</p> : null}
            </div>
          </Card>

          <Card className="p-5">
            <CardHeader title="Execution Focus" subtitle="Projects under 60% completion or delayed." />
            <p className="text-4xl font-semibold text-slate-900">{atRiskProjects.length}</p>
            <p className="mt-2 text-sm text-slate-500">
              Prioritize owner follow-up and CAPA review on these projects.
            </p>
          </Card>
        </section>
      ) : null}

      {role === "TEAM_MEMBER" ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="My Queue (Todo)" value={todoTasks} tone="amber" />
          <StatCard title="In Progress" value={inProgressTasks} tone="teal" />
          <StatCard title="Completed" value={doneTasks} />
          <StatCard title="Overdue Alerts" value={summary.delayedTasks} tone="red" />
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="p-0">
          <div className="p-5 pb-1">
            <CardHeader title="Task Status Distribution" subtitle="Quick view of execution flow." />
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
            <CardHeader title="Project Progress" subtitle="Completion percentage by project." />
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

      {isProjectManager ? (
        <section className="saas-card p-5">
          <CardHeader title="Manager Action Board" subtitle="Comprehensive project-by-project control for weekly review." />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-2">Project</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Progress</th>
                  <th className="py-2">Done / Total</th>
                  <th className="py-2">Priority</th>
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
                        ? "Escalate"
                        : project.status === "At Risk" || project.progress < 75
                          ? "Track"
                          : "Stable";

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
            <CardHeader title="Completion Gauge" subtitle="Current execution completion ratio." />
          </div>
          <div className="h-64 px-2 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="70%"
                outerRadius="100%"
                barSize={14}
                data={[{ name: "Completion", value: globalCompletionRate }]}
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
            <CardHeader title="Project Status Mix" subtitle="Distribution by lifecycle status." />
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
            <CardHeader title="Workload Split" subtitle="Open versus completed task volume." />
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
            <CardHeader title="Control Priority Projects" subtitle="Lowest progress projects needing intervention." />
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
              <CardHeader title="KPI Performance Bands" subtitle="Control distribution across KPI quality bands." />
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
              <CardHeader title="Personal Execution Focus" subtitle="Project-by-project progress on assigned scope." />
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
          <CardHeader title={isProjectManager ? "KPI Indicators (Manager View)" : "KPI Indicators"} subtitle={isProjectManager ? "Process-level targets, to support project steering and CAPA prioritization." : "Process-level targets and attainment."} />
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-2">Process</th>
                  <th className="py-2">Indicator</th>
                  <th className="py-2">Current</th>
                  <th className="py-2">Target</th>
                  <th className="py-2">Achievement</th>
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
      ) : (
        <section className="saas-card p-5">
          <CardHeader title="Execution Hint" subtitle="Keep your personal board healthy and predictable." />
          <p className="mt-2 text-sm text-slate-600">
            Focus on moving tasks from Todo to Done and keep overdue alerts at zero.
          </p>
        </section>
      )}
    </div>
  );
}
