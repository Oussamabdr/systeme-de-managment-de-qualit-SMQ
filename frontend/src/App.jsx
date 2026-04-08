import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import RoleRoute from "./components/layout/RoleRoute";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ProcessesPage = lazy(() => import("./pages/ProcessesPage"));
const ProcessDetailsPage = lazy(() => import("./pages/ProcessDetailsPage"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const ProjectDetailsPage = lazy(() => import("./pages/projects/ProjectDetailsPage"));
const TasksPage = lazy(() => import("./pages/TasksPage"));
const DocumentsPage = lazy(() => import("./pages/DocumentsPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));

function ScreenLoader() {
  return <div className="saas-card p-6 text-sm text-slate-500">Loading workspace...</div>;
}

export default function App() {
  return (
    <Suspense fallback={<ScreenLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />

            <Route element={<RoleRoute allowedRoles={["ADMIN", "PROJECT_MANAGER"]} />}>
              <Route path="/processes" element={<ProcessesPage />} />
              <Route path="/processes/:processId" element={<ProcessDetailsPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
            </Route>

            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
