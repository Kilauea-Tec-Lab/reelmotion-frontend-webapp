import Cookies from "js-cookie";

// Thin JSON client for the /api/developer/* endpoints (API keys, OAuth apps,
// authorized apps). Throws with the backend's message on non-2xx.
async function api(path, { method = "GET", body } = {}) {
  const response = await fetch(`${import.meta.env.VITE_APP_BACKEND_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + Cookies.get("token"),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json.message || json.error?.message || json.error || `HTTP ${response.status}`);
  }
  return json.data ?? json;
}

export const listApiKeys = () => api("developer/keys");
export const createApiKey = (label, scopes) => api("developer/keys", { method: "POST", body: { label, scopes } });
export const revokeApiKey = (id) => api(`developer/keys/${id}`, { method: "DELETE" });

export const listOAuthClients = () => api("developer/clients");
export const createOAuthClient = (payload) => api("developer/clients", { method: "POST", body: payload });
export const updateOAuthClient = (id, payload) => api(`developer/clients/${id}`, { method: "PATCH", body: payload });
export const rotateOAuthClientSecret = (id) => api(`developer/clients/${id}/rotate-secret`, { method: "POST" });
export const deleteOAuthClient = (id) => api(`developer/clients/${id}`, { method: "DELETE" });

export const listAuthorizations = () => api("developer/authorizations");
export const revokeAuthorization = (clientId) => api(`developer/authorizations/${clientId}`, { method: "DELETE" });

// OAuth consent page
export const getAuthorizeInfo = (query) => api(`oauth/authorize-info?${query}`);
export const approveAuthorization = (params, approve) =>
  api("oauth/authorize", { method: "POST", body: { ...params, approve } });

export const SCOPES = ["profile", "billing", "generate", "tasks:read"];
