import Cookies from "js-cookie";
import { api, uploadImage } from "../studio/functions";

export const listBrands = () => api("brands").then((r) => r.data);
export const createBrand = (data) => api("brands", { method: "POST", body: data }).then((r) => r.data);
export const updateBrand = (id, data) => api(`brands/${id}`, { method: "PATCH", body: data }).then((r) => r.data);
export const deleteBrand = (id) => api(`brands/${id}`, { method: "DELETE" });
export const setDefaultBrand = (id) => api(`brands/${id}/default`, { method: "POST" }).then((r) => r.data);
export { uploadImage };

export const MAX_BRANDS = 10;
export const LOGO_KINDS = ["primary", "light", "dark", "icon", "watermark"];
export const COLOR_KEYS = ["primary", "secondary", "accent", "background_dark", "background_light", "text_on_dark", "text_on_light"];

/** IA: prellena el formulario desde web, imágenes y notas. Cobra tokens según el uso real. */
export function autofillBrand({ url, notes, images }) {
  const form = new FormData();
  if (url) form.append("url", url);
  if (notes) form.append("notes", notes);
  images.forEach((f) => form.append("images[]", f));
  // TEMP debug: muestra status + cuerpo crudo si no es JSON
  return fetch(import.meta.env.VITE_APP_BACKEND_URL + "brands/autofill", { method: "POST", headers: { Accept: "application/json", Authorization: "Bearer " + Cookies.get("token") }, body: form })
    .then(async (res) => {
      const text = await res.text();
      let json; try { json = JSON.parse(text); } catch { throw new Error(`HTTP ${res.status}, body: ${text.slice(0, 200) || "(empty)"}`); }
      if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
      return json;
    });
}
