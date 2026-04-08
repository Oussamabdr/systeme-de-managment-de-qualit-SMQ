import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function expectMatch(content, pattern, message) {
  if (!pattern.test(content)) {
    throw new Error(message);
  }
}

function expectRouteAuth(routeFile, routeSnippet, roles) {
  const joined = roles.map((role) => `"${role}"`).join(", ");
  const escapedSnippet = routeSnippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`${escapedSnippet}\\s*,\\s*(authorize|checkRole)\\(${joined}\\)`);
  const content = read(routeFile);
  expectMatch(
    content,
    pattern,
    `Route auth mismatch in ${routeFile}: expected ${routeSnippet} with authorize(${joined})`,
  );
}

function run() {
  const projectsPage = read("src/pages/ProjectsPage.jsx");
  const tasksPage = read("src/pages/TasksPage.jsx");
  const documentsPage = read("src/pages/DocumentsPage.jsx");
  const documentController = read("../backend/src/controllers/document.controller.js");
  const documentService = read("../backend/src/services/document.service.js");
  const taskService = read("../backend/src/services/task.service.js");
  const notificationService = read("../backend/src/services/notification.service.js");

  // Backend auth rules for sensitive actions.
  expectRouteAuth("../backend/src/routes/project.routes.js", "router.post(\"/\"", ["ADMIN", "PROJECT_MANAGER"]);
  expectRouteAuth("../backend/src/routes/project.routes.js", "router.delete(\"/:id\"", ["ADMIN"]);
  expectRouteAuth("../backend/src/routes/task.routes.js", "router.post(\"/\"", ["PROJECT_MANAGER"]);
  expectRouteAuth("../backend/src/routes/dashboard.routes.js", "router.get(\"/overview\"", ["ADMIN", "PROJECT_MANAGER"]);

  // Frontend controls for project page.
  expectMatch(
    projectsPage,
    /const\s+isAdmin\s*=\s*user\?\.role\s*===\s*"ADMIN"/,
    "ProjectsPage: missing isAdmin role guard",
  );
  expectMatch(
    projectsPage,
    /const\s+canManage\s*=\s*user\?\.role\s*===\s*"ADMIN"\s*\|\|\s*user\?\.role\s*===\s*"PROJECT_MANAGER"/,
    "ProjectsPage: missing canManage role guard",
  );
  expectMatch(
    projectsPage,
    /\{canManage\s*\?\s*\(/,
    "ProjectsPage: create or assign actions are not role-guarded by canManage",
  );
  expectMatch(
    projectsPage,
    /\{isAdmin\s*\?\s*\([\s\S]*Delete[\s\S]*\)\s*:\s*null\}/,
    "ProjectsPage: delete action is not restricted to admin",
  );

  // Frontend controls for task creation.
  expectMatch(
    tasksPage,
    /const\s+canCreateTask\s*=\s*isProjectManager/,
    "TasksPage: missing canCreateTask role guard",
  );
  expectMatch(
    tasksPage,
    /if\s*\(\s*!canCreateTask\s*\)\s*return;/,
    "TasksPage: createTask handler is not guarded",
  );
  expectMatch(
    tasksPage,
    /\{canCreateTask\s*\?\s*\(/,
    "TasksPage: task creation section is not guarded in UI",
  );

  // Team-member task limits are enforced in backend service layer.
  expectMatch(
    taskService,
    /Team members can only update task status/,
    "Task service: missing team-member status-only restriction",
  );
  expectMatch(
    taskService,
    /task\.assigneeId\s*!==\s*user\.id/,
    "Task service: missing team-member ownership check",
  );

  // Frontend and backend controls for document uploads.
  expectMatch(
    documentsPage,
    /const\s+isTeamMember\s*=\s*user\?\.role\s*===\s*"TEAM_MEMBER"/,
    "DocumentsPage: missing team-member role detection",
  );
  expectMatch(
    documentsPage,
    /if\s*\(\s*isTeamMember\s*&&\s*!form\.taskId\s*\)/,
    "DocumentsPage: missing team-member task requirement",
  );
  expectMatch(
    documentController,
    /validateUploadScopeForUser\(req\.user,\s*payload\)/,
    "Document controller: upload scope validation not enforced",
  );
  expectMatch(
    documentService,
    /Team members can only upload documents to their own tasks/,
    "Document service: missing team-member upload rule",
  );

  // Notifications are scoped for team members.
  expectMatch(
    notificationService,
    /if\s*\(user\?\.role\s*===\s*"TEAM_MEMBER"\)/,
    "Notification service: missing team-member scoped logic",
  );

  console.log("Role-control checks passed.");
}

run();
