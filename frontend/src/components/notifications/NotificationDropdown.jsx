import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, TriangleAlert, ShieldAlert, Bell, ExternalLink } from "lucide-react";
import api from "../../api/client";
import { useUiStore } from "../../store/uiStore";
import { useNotificationStore } from "../../store/notificationStore";
import { t } from "../../utils/i18n";

const ITEMS_LIMIT = 3;

function roleLabel(role, text) {
  const labels = {
    ADMIN: text("Direction Generale Qualite", "Quality Executive Office"),
    PROJECT_MANAGER: text("Responsable projet", "Project Manager"),
    TEAM_MEMBER: text("Membre equipe", "Team Member"),
    CAQ: "CAQ",
  };
  return labels[role] || role?.replaceAll("_", " ");
}

export default function NotificationDropdown({ onClose }) {
  const [state, setState] = useState({ loading: true, data: null });
  const language = useUiStore((s) => s.language);
  const breakdown = useNotificationStore((s) => s.breakdown);
  const text = (fr, en) => t(language, fr, en);
  const panelRef = useRef(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    let mounted = true;
    api.get("/notifications").then(({ data }) => {
      if (mounted) setState({ loading: false, data: data.data });
    }).catch(() => {
      if (mounted) setState({ loading: false, data: null });
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    }
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const { data } = state;
  const overdueTasks = data?.overdueTasks?.slice(0, ITEMS_LIMIT) || [];
  const delayedProjects = data?.delayedProjects?.slice(0, ITEMS_LIMIT) || [];
  const receivedReports = data?.receivedReports?.slice(0, ITEMS_LIMIT) || [];

  const tabs = [
    { key: "all", label: text("Tout", "All") },
    { key: "reports", label: text("Rapports", "Reports"), count: breakdown.reports },
    { key: "tasks", label: text("Taches", "Tasks"), count: breakdown.overdueTasks },
    { key: "projects", label: text("Projets", "Projects"), count: breakdown.delayedProjects },
  ];

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 origin-top-right rounded-xl border border-slate-200 bg-white shadow-lg ring-1 ring-black/5 z-50 animate-in fade-in slide-in-from-top-2"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">{text("Notifications", "Notifications")}</h3>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
          <Bell size={12} />
          {breakdown.reports + breakdown.overdueTasks + breakdown.delayedProjects}
        </span>
      </div>

      <div className="flex gap-1 border-b border-slate-100 px-3 py-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${
                activeTab === tab.key ? "bg-white/20" : "bg-slate-200 text-slate-600"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="max-h-72 overflow-y-auto">
        {state.loading ? (
          <div className="flex items-center justify-center py-8 text-sm text-slate-400">
            {text("Chargement...", "Loading...")}
          </div>
        ) : (
          <>
            {(activeTab === "all" || activeTab === "reports") && receivedReports.map((r) => (
              <Link
                key={r.id}
                to="/corrective-actions"
                onClick={onClose}
                className="flex items-start gap-3 border-b border-slate-50 px-4 py-3 text-sm transition-colors hover:bg-slate-50"
              >
                <Mail size={14} className="mt-0.5 shrink-0 text-blue-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{r.title}</p>
                  <p className="truncate text-xs text-slate-500">
                    {r.createdBy?.fullName || "-"} &middot; {r.severity}
                  </p>
                </div>
              </Link>
            ))}

            {(activeTab === "all" || activeTab === "tasks") && overdueTasks.map((t_) => (
              <Link
                key={t_.id}
                to="/tasks"
                onClick={onClose}
                className="flex items-start gap-3 border-b border-slate-50 px-4 py-3 text-sm transition-colors hover:bg-slate-50"
              >
                <TriangleAlert size={14} className="mt-0.5 shrink-0 text-rose-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{t_.title}</p>
                  <p className="truncate text-xs text-slate-500">
                    {t_.project?.name} &middot; {t_.assignee?.fullName || text("Non assigne", "Unassigned")}
                  </p>
                </div>
              </Link>
            ))}

            {(activeTab === "all" || activeTab === "projects") && delayedProjects.map((p) => (
              <Link
                key={p.id}
                to="/projects"
                onClick={onClose}
                className="flex items-start gap-3 border-b border-slate-50 px-4 py-3 text-sm transition-colors hover:bg-slate-50"
              >
                <ShieldAlert size={14} className="mt-0.5 shrink-0 text-amber-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{p.name}</p>
                  <p className="truncate text-xs text-amber-600">{text("Retarde", "Delayed")}</p>
                </div>
              </Link>
            ))}

            {!state.loading && receivedReports.length === 0 && overdueTasks.length === 0 && delayedProjects.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-sm text-slate-400">
                <Bell size={24} className="mb-2 text-slate-300" />
                {text("Aucune notification.", "No notifications.")}
              </div>
            )}
          </>
        )}
      </div>

      <Link
        to="/notifications"
        onClick={onClose}
        className="flex items-center justify-center gap-1.5 border-t border-slate-100 px-4 py-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
      >
        {text("Voir tout", "View all")}
        <ExternalLink size={12} />
      </Link>
    </div>
  );
}
