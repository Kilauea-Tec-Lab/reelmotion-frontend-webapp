import Cookies from "js-cookie";
import { getChatDetails } from "../chat/functions";

const BASE = import.meta.env.VITE_APP_BACKEND_URL; // termina en /api/

async function api(path, { method = "GET", body, form } = {}) {
  const headers = { Authorization: "Bearer " + Cookies.get("token") };
  if (body) headers["Content-Type"] = "application/json";
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: form || (body ? JSON.stringify(body) : undefined),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.message || json.error?.message || `HTTP ${res.status}`);
  }
  return json;
}

// ── Projects ────────────────────────────────────────────────────────────
export const listProjects = (q = "") =>
  api(`studio/projects${q ? `?q=${encodeURIComponent(q)}` : ""}`).then((r) => r.data);
export const createProject = (data) => api("studio/projects", { method: "POST", body: data }).then((r) => r.data);
export const getProject = (id) => api(`studio/projects/${id}`).then((r) => r.data);
export const updateProject = (id, data) => api(`studio/projects/${id}`, { method: "PATCH", body: data }).then((r) => r.data);
export const deleteProject = (id) => api(`studio/projects/${id}`, { method: "DELETE" });

// ── Assets ──────────────────────────────────────────────────────────────
export const createAsset = (projectId, data) =>
  api(`studio/projects/${projectId}/assets`, { method: "POST", body: data }).then((r) => r.data);
export const deleteAsset = (projectId, assetId) =>
  api(`studio/projects/${projectId}/assets/${assetId}`, { method: "DELETE" });

// ── Shots ───────────────────────────────────────────────────────────────
export const createShot = (projectId, data) =>
  api(`studio/projects/${projectId}/shots`, { method: "POST", body: data }).then((r) => r.data);
export const updateShot = (projectId, shotId, data) =>
  api(`studio/projects/${projectId}/shots/${shotId}`, { method: "PATCH", body: data }).then((r) => r.data);
export const reorderShots = (projectId, ids) =>
  api(`studio/projects/${projectId}/shots/reorder`, { method: "POST", body: { ids } }).then((r) => r.data);
export const deleteShot = (projectId, shotId) =>
  api(`studio/projects/${projectId}/shots/${shotId}`, { method: "DELETE" });
export const generateShot = (projectId, shotId) =>
  api(`studio/projects/${projectId}/shots/${shotId}/generate`, { method: "POST" }).then((r) => r.data);
export const getShotLastFrame = (projectId, shotId) =>
  api(`studio/projects/${projectId}/shots/${shotId}/last-frame`).then((r) => r.data.last_frame_url);

// ── Tokens del usuario (mismo endpoint que el header del chat) ──────────
export const getUserTokens = () => api("users/tokens").then((r) => Number(r.data) || 0);

// ── Catálogo de modelos (público) ───────────────────────────────────────
let modelsCache = null;
export async function getVideoModels() {
  if (modelsCache) return modelsCache;
  const res = await fetch(BASE + "v1/models?type=video");
  const json = await res.json();
  modelsCache = json.data || [];
  return modelsCache;
}

/** Sube una imagen al bucket (mismo endpoint que el chat) y devuelve su URL pública. */
export async function uploadImage(file) {
  const form = new FormData();
  form.append("files[]", file);
  form.append("type", "image");
  const json = await api("ai/upload-attachments", { method: "POST", form });
  const url = json?.data?.[0]?.url;
  if (!url) throw new Error("Upload completed but URL was not returned");
  return url;
}

/** Loader de /app/projects/:projectId: proyecto + datos del chat 1:1. */
export async function projectWorkspaceLoader({ params }) {
  const project = await getProject(params.projectId);
  const chatData = project.chat_id ? await getChatDetails(project.chat_id) : null;
  return { project, chatData };
}
