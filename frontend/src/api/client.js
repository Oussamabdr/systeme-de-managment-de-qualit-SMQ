import axios from "axios";

const defaultApiBaseUrl =
  typeof window !== "undefined" && window.location.hostname.includes("localhost")
    ? "/api"
    : "https://iso-lemon.vercel.app/api";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultApiBaseUrl,
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
