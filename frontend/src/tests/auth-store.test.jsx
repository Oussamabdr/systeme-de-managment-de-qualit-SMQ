import { beforeEach, describe, expect, it, vi } from "vitest";

describe("auth store", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it("ignores corrupted saved user data", async () => {
    localStorage.setItem("qms_user", "{invalid json");

    const { useAuthStore } = await import("../store/authStore");
    const state = useAuthStore.getState();

    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });
});
