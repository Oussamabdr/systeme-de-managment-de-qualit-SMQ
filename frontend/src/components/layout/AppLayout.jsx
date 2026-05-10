import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, FolderKanban, GitFork, ListTodo, FileText, Bell, Search, ChevronDown, ShieldAlert, ClipboardCheck } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
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
    roles: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"],
  },
  {
    to: "/projects",
    label: t(language, "Projets", "Projects"),
    icon: FolderKanban,
    roles: ["ADMIN", "PROJECT_MANAGER"],
  },
  {
    to: "/processes",
    label: t(language, "Processus", "Processes"),
    icon: GitFork,
    roles: ["ADMIN", "PROJECT_MANAGER"],
  },
  {
    to: "/tasks",
    label: t(language, "Taches", "Tasks"),
    icon: ListTodo,
    roles: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"],
  },
  {
    to: "/documents",
    label: t(language, "Documents", "Documents"),
    icon: FileText,
    roles: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"],
  },
  {
    to: "/non-conformities",
    label: t(language, "Non-conformites", "Non-conformities"),
    icon: ShieldAlert,
    roles: ["ADMIN", "PROJECT_MANAGER", "CAQ"],
  },
  {
    to: "/corrective-actions",
    label: t(language, "Actions CAPA", "CAPA actions"),
    icon: ClipboardCheck,
    roles: ["ADMIN", "PROJECT_MANAGER", "CAQ"],
  },
  {
    to: "/notifications",
    label: t(language, "Alertes", "Alerts"),
    icon: Bell,
    roles: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"],
    hidden: true,
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
  "/notifications": t(language, "Alertes", "Alerts"),
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

  const text = (fr, en) => t(language, fr, en);
  const navItems = getNavItems(language);
  const titleMap = getTitleMap(language);

  const visibleNavItems = navItems.filter((item) => item.roles.includes(user?.role) && !item.hidden);

  const pageTitle = useMemo(() => {
    const matched = Object.entries(titleMap).find(([path]) => location.pathname.startsWith(path));
    return matched ? matched[1] : text("Espace de travail", "Workspace");
  }, [location.pathname, language]);

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="si-shell mx-auto grid min-h-screen max-w-385 grid-cols-1 gap-5 px-4 py-5 lg:grid-cols-[260px_1fr]">
      <aside className="surface h-fit p-5 lg:sticky lg:top-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{text("ESI SGQ", "ESI QMS")}</p>
          <h1 className="mt-2 text-[21px] font-semibold text-slate-900">{text("Suivi qualite", "Quality tracking")}</h1>
          <p className="mt-2 text-sm text-slate-500">{text("Projets, processus, taches et actions qualite.", "Projects, processes, tasks, and quality actions.")}</p>
        </div>

        <nav className="mt-8 flex flex-col gap-1.5">
          {visibleNavItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              <Icon size={16} strokeWidth={1.8} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-8 rounded-xl border border-slate-200/80 bg-slate-50 p-3 text-sm">
          <p className="font-medium text-slate-900">{user?.fullName}</p>
          <p className="mt-0.5 text-xs uppercase tracking-wide text-slate-500">{user?.role?.replaceAll("_", " ")}</p>
          <p className="mt-2 text-xs text-slate-500">{text("Les acces dependent du role attribue au compte.", "Access depends on the role assigned to the account.")}</p>
          <Button variant="subtle" className="mt-3 w-full" onClick={onLogout}>
            {text("Deconnexion", "Sign out")}
          </Button>
        </div>
      </aside>

      <main className="space-y-5 pb-10">
        <header className="surface flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{text("Qualite / ", "Quality / ")}{pageTitle}</p>
            <h2 className="text-xl font-semibold text-slate-900">{pageTitle}</h2>
            <p className="text-sm text-slate-500">{text("Suivi des donnees ISO 9001 et des actions en cours.", "Track ISO 9001 records and current actions.")}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden min-w-65 sm:block">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input placeholder={text("Rechercher les projets, les taches, les docs...", "Search projects, tasks, docs...")} className="pl-9" />
            </div>

            {/* Theme & Language Toggle */}
            <ThemeLanguageToggle 
              theme={theme} 
              setTheme={setTheme} 
              language={language} 
              setLanguage={setLanguage}
              variant="expanded"
            />

            <button className="saas-btn saas-btn-subtle h-10 w-10 p-0" aria-label={text("Notifications", "Notifications")}>
              <Bell size={16} />
            </button>

            <button
              className="saas-btn saas-btn-subtle gap-2"
              onClick={() => setIsMenuOpen((prev) => !prev)}
            >
              <span className="text-sm">{user?.fullName?.split(" ")[0]}</span>
              <ChevronDown size={14} />
            </button>
          </div>
        </header>

        {isMenuOpen ? (
          <div className="surface ml-auto w-55 p-3">
            <div className="space-y-3">
              {/* Theme & Language in Mobile Menu */}
              <div>
                <label className="text-xs uppercase tracking-[0.14em] text-slate-500 block mb-2">{text("Parametres", "Settings")}</label>
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
