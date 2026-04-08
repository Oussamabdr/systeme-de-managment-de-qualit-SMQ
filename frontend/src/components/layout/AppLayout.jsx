import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, FolderKanban, GitFork, ListTodo, FileText, Bell, Search, ChevronDown } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { Input } from "../ui/Input";
import Button from "../ui/Button";

const navItems = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"],
  },
  {
    to: "/projects",
    label: "Projects",
    icon: FolderKanban,
    roles: ["ADMIN", "PROJECT_MANAGER"],
  },
  {
    to: "/processes",
    label: "Processes",
    icon: GitFork,
    roles: ["ADMIN", "PROJECT_MANAGER"],
  },
  {
    to: "/tasks",
    label: "Tasks",
    icon: ListTodo,
    roles: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"],
  },
  {
    to: "/documents",
    label: "Documents",
    icon: FileText,
    roles: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"],
  },
  {
    to: "/notifications",
    label: "Alerts",
    icon: Bell,
    roles: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"],
    hidden: true,
  },
];

const titleMap = {
  "/dashboard": "Dashboard",
  "/projects": "Projects",
  "/processes": "Processes",
  "/tasks": "Tasks",
  "/documents": "Documents",
  "/notifications": "Notifications",
};

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const visibleNavItems = navItems.filter((item) => item.roles.includes(user?.role) && !item.hidden);

  const pageTitle = useMemo(() => {
    const matched = Object.entries(titleMap).find(([path]) => location.pathname.startsWith(path));
    return matched ? matched[1] : "Workspace";
  }, [location.pathname]);

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="mx-auto grid min-h-screen max-w-385 grid-cols-1 gap-5 px-4 py-5 lg:grid-cols-[248px_1fr]">
      <aside className="surface h-fit p-5 lg:sticky lg:top-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">ESI QMS</p>
          <h1 className="mt-2 text-[22px] font-semibold text-slate-900">ISO 9001 Hub</h1>
          <p className="mt-2 text-sm text-slate-500">Precision workflows for quality certification.</p>
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
          <Button variant="subtle" className="mt-3 w-full" onClick={onLogout}>
            Sign out
          </Button>
        </div>
      </aside>

      <main className="space-y-5 pb-10">
        <header className="surface flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{pageTitle}</h2>
            <p className="text-sm text-slate-500">Manage ISO 9001 operations with calm precision.</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative hidden min-w-65 sm:block">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input placeholder="Search projects, tasks, docs..." className="pl-9" />
            </div>

            <button className="saas-btn saas-btn-subtle h-10 w-10 p-0" aria-label="Notifications">
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
          <div className="surface ml-auto w-55 p-2">
            <button className="saas-btn saas-btn-ghost w-full justify-start text-sm" onClick={onLogout}>
              Logout
            </button>
          </div>
        ) : null}

        <div className="saas-page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
