export function getErrorMessage(error) {
  const code = error?.code;
  const message = String(error?.message || "").toLowerCase();

  if (code === "ECONNABORTED" || message.includes("timeout")) {
    return "Le serveur met trop de temps a repondre. Verifiez la connexion API (backend).";
  }

  if (message.includes("network error")) {
    return "Connexion impossible au serveur API. Verifiez que le backend est en ligne.";
  }

  return error?.response?.data?.message || error?.message || "Unexpected error";
}
