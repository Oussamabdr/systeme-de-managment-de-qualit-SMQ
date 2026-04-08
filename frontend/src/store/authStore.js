import { create } from "zustand";
import api from "../api/client";

const storage =
  typeof globalThis !== "undefined" &&
  globalThis.localStorage &&
  typeof globalThis.localStorage.getItem === "function" &&
  typeof globalThis.localStorage.setItem === "function" &&
  typeof globalThis.localStorage.removeItem === "function"
    ? globalThis.localStorage
    : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      };

const initialState = {
  token: storage.getItem("qms_token"),
  user: JSON.parse(storage.getItem("qms_user") || "null"),
};

export const useAuthStore = create((set) => ({
  ...initialState,
  loading: false,
  async login(payload) {
    set({ loading: true });
    try {
      const { data } = await api.post("/auth/login", payload);
      storage.setItem("qms_token", data.token);
      storage.setItem("qms_user", JSON.stringify(data.user));
      set({ token: data.token, user: data.user, loading: false });
      return data;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  async register(payload) {
    set({ loading: true });
    try {
      const { data } = await api.post("/auth/register", payload);
      storage.setItem("qms_token", data.token);
      storage.setItem("qms_user", JSON.stringify(data.user));
      set({ token: data.token, user: data.user, loading: false });
      return data;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  logout() {
    storage.removeItem("qms_token");
    storage.removeItem("qms_user");
    set({ token: null, user: null });
  },
}));
