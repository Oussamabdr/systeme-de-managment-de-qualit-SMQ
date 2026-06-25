import { create } from "zustand";
import api from "../api/client";

export const useNotificationStore = create((set, get) => ({
  unreadCount: 0,
  breakdown: { reports: 0, overdueTasks: 0, delayedProjects: 0 },
  dropdownOpen: false,
  loading: false,

  fetchUnreadCount: async () => {
    try {
      const { data } = await api.get("/notifications/unread-count");
      if (data.success) {
        set({ unreadCount: data.data.count, breakdown: data.data.breakdown });
      }
    } catch {
      // silent
    }
  },

  toggleDropdown: () => set((s) => ({ dropdownOpen: !s.dropdownOpen })),
  closeDropdown: () => set({ dropdownOpen: false }),
}));
