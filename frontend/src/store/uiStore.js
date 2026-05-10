import { create } from "zustand";

const storage =
  typeof globalThis !== "undefined" &&
  globalThis.localStorage &&
  typeof globalThis.localStorage.getItem === "function" &&
  typeof globalThis.localStorage.setItem === "function"
    ? globalThis.localStorage
    : {
        getItem: () => null,
        setItem: () => {},
      };

const defaultLanguage = storage.getItem("qms_lang") || "fr";
const defaultTheme = storage.getItem("qms_theme") || "dark";

function applyTheme(theme) {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = theme;
  }
}

applyTheme(defaultTheme);

export const useUiStore = create((set) => ({
  language: defaultLanguage,
  theme: defaultTheme,
  setLanguage: (language) => {
    storage.setItem("qms_lang", language);
    set({ language });
  },
  setTheme: (theme) => {
    storage.setItem("qms_theme", theme);
    applyTheme(theme);
    set({ theme });
  },
}));
