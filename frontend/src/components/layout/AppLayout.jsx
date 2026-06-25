import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, FolderKanban, GitFork, ListTodo, FileText, Bell, Search, ChevronDown, ShieldAlert, ClipboardCheck } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useNotificationStore } from "../../store/notificationStore";
import NotificationDropdown from "../notifications/NotificationDropdown";
import { Input } from "../ui/Input";
import Button from "../ui/Button";
import ThemeLanguageToggle from "../ui/ThemeLanguageToggle";
import { useUiStore } from "../../store/uiStore";
import { t } from "../../utils/i18n";

const getNavItems = (language) => [
  {
    to: "/dashboard",
    label: t(language, "Tableau de bord", "Dashboard"),
    icon: LayoutDashboard,
    roles: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "CAQ"],
    group: "pilotage",
  },
  {
    to: "/projects",
    label: t(language, "Projets", "Projects"),
    icon: FolderKanban,
    roles: ["ADMIN", "PROJECT_MANAGER"],
    group: "pilotage",
  },
  {
    to: "/processes",
    label: t(language, "Processus", "Processes"),
    icon: GitFork,
    roles: ["ADMIN", "PROJECT_MANAGER"],
    group: "pilotage",
  },
  {
    to: "/tasks",
    label: t(language, "Taches", "Tasks"),
    icon: ListTodo,
    roles: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"],
    group: "execution",
  },
  {
    to: "/documents",
    label: t(language, "Documents", "Documents"),
    icon: FileText,
    roles: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"],
    group: "execution",
  },
  {
    to: "/non-conformities",
    label: t(language, "Non-conformites", "Non-conformities"),
    icon: ShieldAlert,
    roles: ["ADMIN", "PROJECT_MANAGER", "CAQ"],
    group: "assurance",
  },
  {
    to: "/corrective-actions",
    label: t(language, "Actions CAPA", "CAPA actions"),
    icon: ClipboardCheck,
    roles: ["ADMIN", "PROJECT_MANAGER", "CAQ"],
    group: "assurance",
  },
  {
    to: "/notifications",
    label: t(language, "Reception", "Inbox"),
    icon: Bell,
    roles: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"],
    group: "assurance",
  },
];

const getTitleMap = (language) => ({
  "/dashboard": t(language, "Tableau de bord", "Dashboard"),
  "/projects": t(language, "Projets", "Projects"),
  "/processes": t(language, "Processus", "Processes"),
  "/tasks": t(language, "Taches", "Tasks"),
  "/documents": t(language, "Documents", "Documents"),
  "/non-conformities": t(language, "Non-conformites", "Non-conformities"),
  "/corrective-actions": t(language, "Actions CAPA", "CAPA actions"),
  "/notifications": t(language, "Reception", "Inbox"),
});

const getRoleLabel = (role, language) => ({
  ADMIN: t(language, "Direction Generale Qualite", "Quality Executive Office"),
  PROJECT_MANAGER: t(language, "Responsable projet", "Project Manager"),
  TEAM_MEMBER: t(language, "Membre equipe", "Team Member"),
  CAQ: "CAQ",
}[role] || role?.replaceAll("_", " "));

const getNavGroups = (language) => ({
  pilotage: t(language, "Pilotage", "Steering"),
  execution: t(language, "Execution", "Execution"),
  assurance: t(language, "Assurance qualite", "Quality assurance"),
});

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const language = useUiStore((state) => state.language);
  const setLanguage = useUiStore((state) => state.setLanguage);
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const dropdownOpen = useNotificationStore((s) => s.dropdownOpen);
  const fetchUnreadCount = useNotificationStore((s) => s.fetchUnreadCount);
  const toggleDropdown = useNotificationStore((s) => s.toggleDropdown);
  const closeDropdown = useNotificationStore((s) => s.closeDropdown);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const text = (fr, en) => t(language, fr, en);
  const navItems = getNavItems(language);
  const titleMap = getTitleMap(language);
  const navGroups = getNavGroups(language);

  const visibleNavItems = navItems.filter((item) => item.roles.includes(user?.role) && !item.hidden);
  const groupedNavItems = Object.entries(navGroups)
    .map(([key, label]) => ({
      key,
      label,
      items: visibleNavItems.filter((item) => item.group === key),
    }))
    .filter((group) => group.items.length > 0);

  const matchedTitle = Object.entries(titleMap).find(([path]) => location.pathname.startsWith(path));
  const pageTitle = matchedTitle ? matchedTitle[1] : text("Espace de travail", "Workspace");
  const userInitial = user?.fullName?.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const visibleModules = visibleNavItems.length;

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="si-shell workspace-shell mx-auto grid min-h-screen max-w-385 grid-cols-1 gap-5 px-4 py-5 lg:grid-cols-[280px_1fr]">
      <aside className="surface workspace-sidebar p-5">
        <div className="workspace-sidebar-hero">
          <div className="workspace-brand-mark">{text("Q", "Q")}</div>
          <div>
            <p className="workspace-brand-eyebrow">{text("ESI SGQ", "ESI QMS")}</p>
            <h1 className="workspace-brand-title">{text("Suivi qualite", "Quality tracking")}</h1>
            <p className="workspace-brand-copy">{text("Pilotage, execution et assurance qualite sur une seule interface.", "Steering, execution, and quality assurance in one workspace.")}</p>
          </div>
        </div>
        <div className="workspace-sidebar-ribbon">
          <span>{text("Modules actifs", "Active modules")}</span>
          <strong>{visibleModules}</strong>
        </div>

        <nav className="workspace-nav">
          {groupedNavItems.map((group) => (
            <div key={group.key} className="workspace-nav-section">
              <p className="workspace-nav-section-label">{group.label}</p>
              <div className="workspace-nav-list">
                {group.items.map((item) => {
                  const NavIcon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `workspace-nav-item ${isActive ? "workspace-nav-item-active" : ""}`
                      }
                    >
                      <span className="workspace-nav-icon">
                        <NavIcon size={16} strokeWidth={1.8} />
                      </span>
                      <span className="workspace-nav-copy">
                        <span className="workspace-nav-title">{item.label}</span>
                        <span className="workspace-nav-subtitle">
                          {group.label}
                        </span>
                      </span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="workspace-profile-card">
          <div className="workspace-profile-top">
            <div className="workspace-profile-avatar">{userInitial || "U"}</div>
            <div>
              <p className="workspace-profile-name">{user?.fullName}</p>
              <p className="workspace-profile-role">{getRoleLabel(user?.role, language)}</p>
            </div>
          </div>
          <p className="workspace-profile-copy">{text("Les acces dependent du role attribue au compte.", "Access depends on the role assigned to the account.")}</p>
          <Button variant="subtle" className="mt-3 w-full" onClick={onLogout}>
            {text("Deconnexion", "Sign out")}
          </Button>
        </div>
      </aside>

      <main className="workspace-main space-y-5 pb-10">
        <header className="surface workspace-header px-5 py-4 relative z-10">
          <div className="workspace-header-copy">
            <p className="workspace-header-eyebrow">{text("Qualite / ", "Quality / ")}{pageTitle}</p>
            <h2 className="workspace-header-title">{pageTitle}</h2>
            <p className="workspace-header-text">{text("Suivi des donnees ISO 9001 et des actions en cours.", "Track ISO 9001 records and current actions.")}</p>
          </div>

          <div className="workspace-header-tools">
            <div className="workspace-header-status">
              <span className="workspace-header-status-pill">{getRoleLabel(user?.role, language)}</span>
              <span className="workspace-header-status-pill workspace-header-status-pill-muted">
                {visibleModules} {text("modules", "modules")}
              </span>
            </div>
            <div className="workspace-search relative hidden min-w-65 sm:block">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input placeholder={text("Rechercher les projets, les taches, les docs...", "Search projects, tasks, docs...")} className="pl-9" />
            </div>

            <ThemeLanguageToggle 
              theme={theme} 
              setTheme={setTheme} 
              language={language} 
              setLanguage={setLanguage}
              variant="expanded"
            />

            <div className="relative">
              <button
                className="saas-btn saas-btn-subtle workspace-icon-btn h-10 w-10 p-0"
                aria-label={text("Notifications", "Notifications")}
                onClick={toggleDropdown}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold leading-none text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
              {dropdownOpen && <NotificationDropdown onClose={closeDropdown} />}
            </div>

            <button
              className="saas-btn saas-btn-subtle workspace-user-btn gap-2"
              onClick={() => setIsMenuOpen((prev) => !prev)}
            >
              <span className="workspace-user-chip">{userInitial || "U"}</span>
              <span className="text-sm">{user?.fullName?.split(" ")[0]}</span>
              <ChevronDown size={14} />
            </button>
          </div>
        </header>

        {isMenuOpen ? (
          <div className="surface workspace-menu-popover ml-auto w-60 p-3">
            <div className="space-y-3">
              <div>
                <label className="workspace-menu-label block mb-2">{text("Parametres", "Settings")}</label>
                <ThemeLanguageToggle 
                  theme={theme} 
                  setTheme={setTheme} 
                  language={language} 
                  setLanguage={setLanguage}
                  variant="expanded"
                />
              </div>
              <button className="saas-btn saas-btn-ghost w-full justify-start text-sm" onClick={onLogout}>
                {text("Deconnexion", "Logout")}
              </button>
            </div>
          </div>
        ) : null}

        <div key={location.pathname} className="saas-page page-transition">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
