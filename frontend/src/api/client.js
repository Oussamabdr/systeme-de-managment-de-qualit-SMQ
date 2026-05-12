import axios from "axios";

const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("localhost") || window.location.hostname === "127.0.0.1");

const defaultApiBaseUrl = isLocalhost ? "/api" : "https://iso-lemon.vercel.app/api";

const configuredBaseUrl = import.meta.env.VITE_API_URL;

// On static hosts like GitHub Pages, a relative "/api" points to GitHub and returns 405.
const effectiveBaseUrl = !isLocalhost && configuredBaseUrl && configuredBaseUrl.startsWith("/")
  ? defaultApiBaseUrl
  : (configuredBaseUrl || defaultApiBaseUrl);

const api = axios.create({
  baseURL: effectiveBaseUrl,
  timeout: 12000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("qms_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const token = localStorage.getItem("qms_token");
    const status = error?.response?.status;
    const message = String(error?.response?.data?.message || "").toLowerCase();
    const isAuthFailure = status === 401 && token && (
      message.includes("jwt expired")
      || message.includes("session expired")
      || message.includes("invalid token")
      || message.includes("unauthorized")
    );

    if (isAuthFailure) {
      localStorage.removeItem("qms_token");
      localStorage.removeItem("qms_user");

      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login?session=expired";
      }
    }

    return Promise.reject(error);
  },
);

export default api;
