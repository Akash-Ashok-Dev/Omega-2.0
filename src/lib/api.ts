const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").trim();
const productionBaseUrl = "https://omega2mec-api.azurewebsites.net";

const apiBaseUrl = (
  configuredBaseUrl || (import.meta.env.PROD ? productionBaseUrl : "")
).replace(/\/+$/, "");

export function apiUrl(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${apiBaseUrl}${normalized}`;
}
