import Cookies from "js-cookie";
import { redirect } from "react-router-dom";

const BASE = import.meta.env.VITE_APP_BACKEND_URL; // termina en /api/

// ponytail: solo oculta el menú; el backend (middleware `admin`) es quien bloquea de verdad.
export const ADMIN_EMAIL = "jgm9292@gmail.com";
export const isAdmin = (user) => user?.email?.toLowerCase() === ADMIN_EMAIL;

async function api(path, { method = "GET" } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { Authorization: "Bearer " + Cookies.get("token"), Accept: "application/json" },
  });
  const json = await res.json().catch(() => ({}));
  if (res.status === 403) throw redirect("/app");
  if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
  return json;
}

// La query string de la URL (q, page, sort, dir, onboarding) se pasa tal cual al backend.
export const usersLoader = ({ request }) => api(`admin/users${new URL(request.url).search}`);
export const userDetailLoader = ({ params }) => api(`admin/users/${params.userId}`).then((r) => r.data);
export const deleteUser = (id) => api(`admin/users/${id}`, { method: "DELETE" });
export const approveUser = (id) => api(`admin/users/${id}/approve`, { method: "POST" });
// Rechazar = borrar la cuenta y bloquear el email para futuros registros.
export const rejectUser = (id) => api(`admin/users/${id}/reject`, { method: "POST" });

export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");
export const fmtNum = (n) => Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
