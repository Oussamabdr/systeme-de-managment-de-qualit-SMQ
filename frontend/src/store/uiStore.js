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

export const useUiStore = create((set) => ({
  language: defaultLanguage,
  setLanguage: (language) => {
    storage.setItem("qms_lang", language);
    set({ language });
  },
}));
