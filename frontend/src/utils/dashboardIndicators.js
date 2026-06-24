import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  FolderKanban,
  Gauge,
  ShieldAlert,
} from "lucide-react";

const severityRank = { critical: 5, high: 4, medium: 3, low: 2, good: 1 };

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
      category: text("Programme", "Program"),
      compareLabel: text("Jalons menaces", "Threatened milestones"),
      compareValue: Math.max(summary.delayedProjects * 2, delayedProjects.length),
      severity: summary.delayedProjects > 2 ? "critical" : summary.delayedProjects > 0 ? "high" : "good",
      priority: summary.delayedProjects > 0 ? 96 + summary.delayedProjects : 18,
      icon: FolderKanban,
      path: role === "TEAM_MEMBER" ? "/tasks" : "/projects",
      source: "DELAYED_PROJECT",
      decisionLabel: text("Arbitrage ressources", "Resource arbitration"),
      recommendedAction:
        summary.delayedProjects > 2
          ? text("Arbitrer aujourd'hui les moyens et geler les priorites secondaires.", "Arbitrate resources today and freeze secondary priorities.")
          : text("Renforcer le suivi projet et proteger le prochain jalon.", "Tighten project follow-up and protect the next milestone."),
      decisionOwner: role === "TEAM_MEMBER" ? text("Chef d'equipe", "Team lead") : text("Direction projet", "Project leadership"),
      timeWindow: summary.delayedProjects > 2 ? text("Aujourd'hui", "Today") : text("Sous 48h", "Within 48h"),
      readiness: summary.delayedProjects > 0 ? text("Decision attendue", "Decision needed") : text("Sous controle", "Under control"),
    },
    {
      id: "overdue-tasks",
      label: text("Taches en retard", "Overdue tasks"),
      value: summary.delayedTasks,
      detail: text(`${openTasks} taches ouvertes`, `${openTasks} open tasks`),
      category: text("Execution", "Execution"),
      compareLabel: text("En cours", "In progress"),
      compareValue: inProgressTasks,
      severity: summary.delayedTasks > 5 ? "critical" : summary.delayedTasks > 0 ? "high" : "good",
      priority: summary.delayedTasks > 0 ? 92 + summary.delayedTasks : 22,
      icon: ClipboardList,
      path: "/tasks",
      source: "OVERDUE_TASK",
      decisionLabel: text("Reallocation charge", "Workload rebalance"),
      recommendedAction:
        summary.delayedTasks > 5
          ? text("Declencher un rattrapage cible et reassigner les taches bloquees.", "Trigger focused catch-up and reassign blocked tasks.")
          : text("Suivre les responsables et confirmer les echeances critiques.", "Follow up owners and confirm critical due dates."),
      decisionOwner: text("Responsable operationnel", "Operational lead"),
      timeWindow: summary.delayedTasks > 5 ? text("Sous 24h", "Within 24h") : text("Sous 72h", "Within 72h"),
      readiness: summary.delayedTasks > 0 ? text("Action immediate utile", "Immediate action useful") : text("Rythme stable", "Stable pace"),
    },
    {
      id: "decision-health",
      label: text("Sante de decision", "Decision health"),
      value: `${decisionScore}%`,
      detail: text(
        "Score base sur retards, CAPA critiques, KPI sous objectif et ecart de ressources.",
        "Score based on delays, critical CAPA, under-target KPIs, and resource variance.",
      ),
      category: text("Pilotage", "Steering"),
      compareLabel: text("Signaux critiques lies", "Linked critical signals"),
      compareValue: summary.delayedProjects + openCriticalCapa,
      severity: decisionScore < 40 ? "critical" : decisionScore < 60 ? "high" : decisionScore < 80 ? "medium" : "good",
      priority: decisionScore < 80 ? 88 + (100 - decisionScore) / 5 : 30,
      icon: Gauge,
      path: role === "TEAM_MEMBER" ? "/tasks" : "/corrective-actions",
      source: "MANUAL",
      decisionLabel: text("Arbitrage de pilotage", "Steering arbitration"),
      recommendedAction:
        decisionScore < 40
          ? text(
              "Escalader a la direction et clarifier les arbitrages ouverts sur projets, CAPA et KPI.",
              "Escalate to leadership and clarify open arbitrations across projects, CAPA, and KPIs.",
            )
          : text(
              "Consolider les alertes globales et confirmer une priorisation unique des sujets critiques.",
              "Consolidate global alerts and confirm a single priority order for critical topics.",
            ),
      decisionOwner: role === "ADMIN" ? text("Direction generale qualite", "Quality executive leadership") : text("Pilote du systeme qualite", "Quality system owner"),
      timeWindow: decisionScore < 40 ? text("Maintenant", "Now") : text("Cette semaine", "This week"),
      readiness: decisionScore < 80 ? text("Pilotage fragilise", "Steering under strain") : text("Pilotage lisible", "Steering is clear"),
    },
    {
      id: "critical-capa",
      label: text("CAPA critiques", "Critical CAPA"),
      value: openCriticalCapa,
      detail: text("Actions ouvertes a verifier", "Open actions to verify"),
      category: "CAPA",
      compareLabel: text("Toutes severites", "All severities"),
      compareValue: Object.values(correctiveActions?.bySeverity || {}).reduce((sum, count) => sum + count, 0),
      severity: openCriticalCapa > 0 ? "critical" : "good",
      priority: openCriticalCapa > 0 ? 86 + openCriticalCapa : 16,
      icon: ShieldAlert,
      path: role === "TEAM_MEMBER" ? "/tasks" : "/corrective-actions",
      source: "MANUAL",
      decisionLabel: text("Traitement CAPA", "CAPA treatment"),
      recommendedAction:
        openCriticalCapa > 0
          ? text("Verifier proprietaire, date cible et preuve attendue pour chaque CAPA critique.", "Verify owner, target date, and expected evidence for each critical CAPA.")
          : text("Conserver la revue periodique sans escalation.", "Keep periodic review without escalation."),
      decisionOwner: text("Qualite / CAQ", "Quality / QA"),
      timeWindow: openCriticalCapa > 0 ? text("Sous 24h", "Within 24h") : text("Revue hebdo", "Weekly review"),
      readiness: openCriticalCapa > 0 ? text("Escalade probable", "Escalation likely") : text("Risque faible", "Low risk"),
    },
    {
      id: "iso-maturity",
      label: text("Maturite ISO", "ISO maturity"),
      value: `${requirementAssessments?.averageScore || 0}%`,
      detail: weakProcesses[0]?.processName || text("Processus maitrises", "Processes controlled"),
      category: text("Conformite", "Compliance"),
      compareLabel: text("Processus faibles", "Weak processes"),
      compareValue: weakProcesses.length,
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
      decisionLabel: text("Plan renfort", "Reinforcement plan"),
      recommendedAction:
        (requirementAssessments?.averageScore || 0) < 70
          ? text("Lancer un plan de remontee sur les processus les plus faibles.", "Launch a recovery plan on the weakest processes.")
          : text("Cibler les processus en-dessous du seuil et verifier les preuves.", "Target sub-threshold processes and verify evidence."),
      decisionOwner: text("Responsable processus", "Process owner"),
      timeWindow: text("Avant prochaine revue", "Before next review"),
      readiness: (requirementAssessments?.averageScore || 0) < 80 ? text("Priorisation necessaire", "Prioritization needed") : text("Base saine", "Healthy baseline"),
    },
    {
      id: "kpi-gap",
      label: text("KPI sous objectif", "KPIs under target"),
      value: weakKpis.length,
      detail: weakKpis[0]?.indicatorName || text("Objectifs tenus", "Targets held"),
      category: "KPI",
      compareLabel: text("KPI suivis", "Tracked KPIs"),
      compareValue: kpis.length,
      severity: weakKpis.length > 3 ? "critical" : weakKpis.length > 0 ? "medium" : "good",
      priority: role !== "TEAM_MEMBER" && weakKpis.length > 0 ? 78 + weakKpis.length : 12,
      icon: AlertTriangle,
      path: "/processes",
      source: "KPI_DEVIATION",
      decisionLabel: text("Pilotage rapproche", "Close steering"),
      recommendedAction:
        weakKpis.length > 0
          ? text("Selectionner les KPI les plus exposes et fixer un responsable de rattrapage.", "Select the most exposed KPIs and assign a recovery owner.")
          : text("Maintenir le rythme de revue courant.", "Maintain the current review rhythm."),
      decisionOwner: text("Manager metier", "Business manager"),
      timeWindow: weakKpis.length > 0 ? text("Sous 7 jours", "Within 7 days") : text("Suivi mensuel", "Monthly follow-up"),
      readiness: weakKpis.length > 0 ? text("Pilotage renforce", "Enhanced steering") : text("Objectifs tenus", "Targets held"),
    },
    {
      id: "completion",
      label: text("Completion globale", "Overall completion"),
      value: `${completion}%`,
      detail: text(`${doneTasks} terminees, ${inProgressTasks} en cours`, `${doneTasks} done, ${inProgressTasks} in progress`),
      category: text("Livraison", "Delivery"),
      compareLabel: text("Taches cloturees", "Completed tasks"),
      compareValue: doneTasks,
      severity: completion < 50 ? "high" : completion < 75 ? "medium" : "good",
      priority: completion < 75 ? 66 + (75 - completion) / 3 : 20,
      icon: CheckCircle2,
      path: role === "TEAM_MEMBER" ? "/tasks" : "/projects",
      source: "MANUAL",
      decisionLabel: text("Protection capacite", "Capacity protection"),
      recommendedAction:
        completion < 75
          ? text("Securiser les taches critiques avant d'ouvrir de nouveaux engagements.", "Secure critical tasks before opening new commitments.")
          : text("Conserver le rythme et surveiller les points de friction.", "Keep the pace and monitor friction points."),
      decisionOwner: text("Pilotage projet", "Project steering"),
      timeWindow: text("Cette semaine", "This week"),
      readiness: completion < 75 ? text("Attention capacite", "Capacity watch") : text("Execution reguliere", "Steady execution"),
    },
    {
      id: "resource-variance",
      label: text("Ecart ressources", "Resource variance"),
      value: `${resourceMonitoring?.variancePercent || 0}%`,
      detail: text("Reel vs planifie", "Actual vs planned"),
      category: text("Capacite", "Capacity"),
      compareLabel: text("Charge estimee", "Estimated load"),
      compareValue: Math.round((resourceMonitoring?.variancePercent || 0) + 70),
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
      decisionLabel: text("Arbitrage capacite", "Capacity arbitration"),
      recommendedAction:
        (resourceMonitoring?.variancePercent || 0) > 15
          ? text("Reequilibrer les affectations et confirmer les activites non prioritaires.", "Rebalance allocations and confirm non-priority activities.")
          : text("Maintenir le plan et surveiller l'ecart reel.", "Keep the plan and monitor the actual variance."),
      decisionOwner: text("Manager ressources", "Resource manager"),
      timeWindow: (resourceMonitoring?.variancePercent || 0) > 30 ? text("Sous 24h", "Within 24h") : text("Sous 5 jours", "Within 5 days"),
      readiness: (resourceMonitoring?.variancePercent || 0) > 15 ? text("Arbitrage utile", "Arbitration useful") : text("Charge absorbee", "Load absorbed"),
    },
  ];

  return allIndicators
    .filter((indicator) => role !== "TEAM_MEMBER" || !["iso-maturity", "kpi-gap"].includes(indicator.id))
    .sort((a, b) => b.priority - a.priority || severityRank[b.severity] - severityRank[a.severity])
    .slice(0, 5);
}

export { buildPriorityIndicators, roleLabel };
