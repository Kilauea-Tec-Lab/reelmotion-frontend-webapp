import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Save, Upload, X } from "lucide-react";
import { useI18n } from "../../i18n/i18n-context";
import { createShot, getVideoModels, updateShot, uploadImage } from "../functions";
import { Modal, Mono } from "./ui";
import { BTN_PRIMARY, BTN_SECONDARY, INPUT } from "./tokens";

const PRESETS = [3, 4, 5, 8, 10, 15, 20, 30];
const CHAIN_MODES = ["none", "last_frame", "extend", "keyframes"];

function durationsFor(model) {
  if (!model?.durations) return [];
  if (model.duration_options) return model.duration_options;
  const [min, max] = model.durations;
  return PRESETS.filter((d) => d >= min && d <= max);
}

function chainSupport(model) {
  const extra = model?.extra_params || {};
  return {
    none: true,
    last_frame: true,
    extend: Array.isArray(extra.mode) && extra.mode.includes("extend"),
    keyframes: "end_frame_url" in extra,
  };
}

function FrameInput({ label, value, onChange }) {
  const { t } = useI18n();
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const pick = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try { onChange(await uploadImage(f)); } finally { setBusy(false); }
  };
  return (
    <div>
      <Mono>{label}</Mono>
      <div className="mt-1 flex items-center gap-2">
        {value && <img src={value} alt="" className="h-10 w-16 object-cover rounded border border-gray-700" />}
        <input ref={ref} type="file" accept="image/*" hidden onChange={pick} />
        <button type="button" onClick={() => ref.current?.click()} disabled={busy} className={`${BTN_SECONDARY} flex items-center gap-2`}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {value ? t("studio.replace") : t("studio.pick-image")}
        </button>
        {value && (
          <button type="button" onClick={() => onChange(null)} className="p-1.5 text-gray-500 hover:text-white"><X className="h-4 w-4" /></button>
        )}
      </div>
    </div>
  );
}

/** Crear/editar una toma. `shot` null = nueva. `isFirst` deshabilita el encadenado. */
export default function ShotEditorModal({ project, shot, isFirst, onClose, onSaved }) {
  const { t } = useI18n();
  const [models, setModels] = useState([]);
  const [form, setForm] = useState({
    prompt: shot?.prompt || "",
    model: shot?.model || "kling-v3",
    duration: shot?.duration || 5,
    chain_mode: shot?.chain_mode || (isFirst ? "none" : "last_frame"),
    asset_ids: shot?.asset_ids || [],
    start_frame_url: shot?.start_frame_url || null,
    end_frame_url: shot?.end_frame_url || null,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => { getVideoModels().then(setModels); }, []);

  const model = useMemo(() => models.find((m) => m.id === form.model), [models, form.model]);
  const durations = durationsFor(model);
  const support = chainSupport(model);
  const supportsRefs = "reference_images" in (model?.extra_params || {});
  const readyAssets = (project.assets || []).filter((a) => a.status === "ready" && a.image_url);

  // Si el modelo no soporta la duración o el modo elegidos, corrige al primero válido.
  useEffect(() => {
    if (!model) return;
    if (durations.length && !durations.includes(Number(form.duration))) set("duration", durations[0]);
    if (!support[form.chain_mode]) set("chain_mode", "none");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model]);

  const toggleAsset = (id) =>
    set("asset_ids", form.asset_ids.includes(id) ? form.asset_ids.filter((x) => x !== id) : [...form.asset_ids, id]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload = { ...form, duration: Number(form.duration), asset_ids: supportsRefs ? form.asset_ids : [] };
      const saved = shot ? await updateShot(project.id, shot.id, payload) : await createShot(project.id, payload);
      onSaved(saved);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal onClose={() => !busy && onClose()} wide>
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{shot ? t("studio.edit-shot") : t("studio.add-shot")}</h3>
          {shot && <Mono>#{String(shot.position).padStart(2, "0")}</Mono>}
        </div>

        <div>
          <Mono>{t("studio.prompt")}</Mono>
          <textarea autoFocus required rows={4} value={form.prompt} onChange={(e) => set("prompt", e.target.value)} placeholder={t("studio.prompt-hint")} className={`${INPUT} mt-1 resize-none`} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Mono>{t("studio.model")}</Mono>
            <select value={form.model} onChange={(e) => set("model", e.target.value)} className={`${INPUT} mt-1`}>
              {models.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <Mono>{t("studio.duration")}</Mono>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {durations.map((d) => (
                <button type="button" key={d} onClick={() => set("duration", d)} className={`px-2.5 py-1.5 rounded-md font-mono text-xs transition-colors ${Number(form.duration) === d ? "bg-[#DC569D] text-white" : "bg-[#2f2f2f] text-gray-400 hover:bg-[#3a3a3a] hover:text-white"}`}>
                  {d}s
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <Mono>{t("studio.chain")}</Mono>
          <div className="mt-1 grid grid-cols-4 gap-1 bg-[#0C0C0D] p-1 rounded-lg border border-gray-800">
            {CHAIN_MODES.map((m) => {
              const enabled = support[m] && (m === "none" || !isFirst);
              return (
                <button
                  type="button"
                  key={m}
                  disabled={!enabled}
                  onClick={() => set("chain_mode", m)}
                  className={`px-2 py-1.5 rounded-md text-xs transition-colors ${form.chain_mode === m ? "bg-[#DC569D] text-white" : "text-gray-400 hover:text-white hover:bg-[#2a2a2a]"} disabled:opacity-30 disabled:hover:bg-transparent`}
                  title={t(`studio.chain-${m}-hint`)}
                >
                  {t(`studio.chain-${m}`)}
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-[11px] text-gray-500">{t(`studio.chain-${form.chain_mode}-hint`)}</p>
        </div>

        {(form.chain_mode === "none" || form.chain_mode === "keyframes") && (
          <FrameInput label={form.chain_mode === "keyframes" ? t("studio.start-frame-optional") : t("studio.start-frame")} value={form.start_frame_url} onChange={(v) => set("start_frame_url", v)} />
        )}
        {form.chain_mode === "keyframes" && (
          <FrameInput label={t("studio.end-frame")} value={form.end_frame_url} onChange={(v) => set("end_frame_url", v)} />
        )}

        {supportsRefs && readyAssets.length > 0 && (
          <div>
            <Mono>{t("studio.use-assets")}</Mono>
            <div className="mt-1 flex flex-wrap gap-2">
              {readyAssets.map((a) => {
                const on = form.asset_ids.includes(a.id);
                return (
                  <button type="button" key={a.id} onClick={() => toggleAsset(a.id)} className={`relative h-14 w-14 rounded-lg overflow-hidden border-2 transition-colors ${on ? "border-[#DC569D] shadow-[0_0_12px_rgba(220,86,157,0.4)]" : "border-gray-800 opacity-60 hover:opacity-100"}`} title={a.name}>
                    <img src={a.image_url} alt={a.name} className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} disabled={busy} className={BTN_SECONDARY}>{t("studio.cancel")}</button>
          <button type="submit" disabled={busy || !form.prompt.trim()} className={BTN_PRIMARY}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t("studio.save")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
