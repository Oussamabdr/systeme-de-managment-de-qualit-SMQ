import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import ProjectsPage from "../pages/ProjectsPage";
import TasksPage from "../pages/TasksPage";
import { useAuthStore } from "../store/authStore";
import api from "../api/client";

vi.mock("../api/client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const baseProject = {
  id: "p1",
  name: "ISO Program",
  status: "IN_PROGRESS",
  description: "QMS deployment",
  tasks: [{ id: "t1", status: "DONE" }, { id: "t2", status: "TODO" }],
  processes: [{ id: "pp1", processId: "proc1" }],
};

function mockApiForPages() {
  api.get.mockImplementation((url) => {
    if (url === "/projects") return Promise.resolve({ data: { data: [baseProject] } });
    if (url === "/processes") return Promise.resolve({ data: { data: [{ id: "proc1", name: "Audit" }] } });
    if (url === "/tasks") return Promise.resolve({ data: { data: [] } });
    if (url === "/users") {
      return Promise.resolve({
        data: {
          data: [
            { id: "u1", fullName: "Admin User" },
            { id: "u2", fullName: "Manager User" },
          ],
        },
      });
    }
    return Promise.resolve({ data: { data: [] } });
  });
}

function setUser(role) {
  useAuthStore.setState({
    token: "test-token",
    user: { id: "u-test", fullName: "Test User", role },
  });
}

describe("Role-based permission visibility", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockApiForPages();
  });

  it("shows project delete action for ADMIN", async () => {
    setUser("ADMIN");
    render(<ProjectsPage />);

    expect(await screen.findByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("hides project delete action for PROJECT_MANAGER", async () => {
    setUser("PROJECT_MANAGER");
    render(<ProjectsPage />);

    await waitFor(() => expect(screen.getByText("ISO Program")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });

  it("shows task creation form for ADMIN", async () => {
    setUser("ADMIN");
    render(<TasksPage />);

    expect(await screen.findByText("Create Task")).toBeInTheDocument();
  });

  it("hides task creation form for TEAM_MEMBER", async () => {
    setUser("TEAM_MEMBER");
    render(<TasksPage />);

    await waitFor(() => expect(api.get).toHaveBeenCalled());
    expect(screen.queryByText("Create Task")).not.toBeInTheDocument();
  });
});
