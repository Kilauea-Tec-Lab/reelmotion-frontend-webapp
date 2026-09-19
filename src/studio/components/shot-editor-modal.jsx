import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Save, Upload, Volume2, X } from "lucide-react";
import { useI18n } from "../../i18n/i18n-context";
import { createShot, getShotLastFrame, getVideoModels, updateShot, uploadImage } from "../functions";
import { Modal, Mono } from "./ui";
import { BTN_PRIMARY, BTN_SECONDARY, INPUT } from "./tokens";

const PRESETS = [3, 4, 5, 8, 10, 15, 20, 30];
const CHAIN_MODES = ["none", "last_frame", "extend", "keyframes"];
const CAP_KEYS = ["refs", "extend", "keyframes", "audio"];
const HINT = "mt-1.5 text-[11px] text-[#F2D543]";

// ponytail: restricciones del proveedor que el catalogo publico no expone.
const HIDDEN_MODELS = ["runway-aleph"]; // video-a-video: necesita un video de entrada, no sirve como toma
const REFS_NEED_VIDEO = ["kling-o3", "kling-o1"]; // su reference-to-video exige un video (Evolink 400)
const NEEDS_START_IMAGE = ["kling-o1"]; // no tiene text-to-video

function durationsFor(model) {
  if (!model?.durations) return [];
  if (model.duration_options) return model.duration_options;
  const [min, max] = model.durations;
  return PRESETS.filter((d) => d >= min && d <= max);
}

/** Qué sabe hacer cada modelo, derivado de `extra_params` del catálogo. */
function capsFor(model) {
  const extra = model?.extra_params || {};
  return {
    refs: "reference_images" in extra && !REFS_NEED_VIDEO.includes(model?.id),
    extend: Array.isArray(extra.mode) && extra.mode.includes("extend"),
    keyframes: "end_frame_url" in extra,
    audio: "generate_audio" in extra,
    resolutions: Array.isArray(extra.resolution) ? extra.resolution : [],
  };
}

function Segmented({ options, value, onChange, render = (o) => o }) {
  return (
    <div className="mt-1 flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button type="button" key={o} onClick={() => onChange(o)} className={`px-2.5 py-1.5 rounded-md font-mono text-xs transition-colors ${value === o ? "bg-[#DC569D] text-white" : "bg-[#2f2f2f] text-gray-400 hover:bg-[#3a3a3a] hover:text-white"}`}>
          {render(o)}
        </button>
      ))}
    </div>
  );
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

/**
 * De qué parte esta toma: último frame (extraído bajo demanda, 2-6 s la primera vez)
 * o el video completo si es "extend". Si la anterior no está lista, lo dice.
 */
function PrevShotPanel({ projectId, prev, mode, customStart }) {
  const { t } = useI18n();
  const ready = prev?.status === "completed" && !!prev.video_url;
  const wantFrame = ready && !customStart && mode !== "extend";
  const [frame, setFrame] = useState(prev?.last_frame_url || null);
  const [state, setState] = useState("idle"); // idle | loading | failed

  useEffect(() => {
    if (!wantFrame || frame) return;
    let alive = true;
    setState("loading");
    getShotLastFrame(projectId, prev.id)
      .then((url) => alive && (setFrame(url), setState("idle")))
      .catch(() => alive && setState("failed"));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantFrame, prev?.id]);

  return (
    <div className="mt-2 flex gap-3 rounded-lg border border-[#DC569D]/30 bg-[#DC569D]/5 p-2">
      <div className="h-16 w-28 shrink-0 rounded overflow-hidden bg-[#0C0C0D] border border-gray-800 flex items-center justify-center">
        {!ready ? (
          <Mono className="text-gray-600">#{String(prev.position).padStart(2, "0")}</Mono>
        ) : mode === "extend" ? (
          <video src={prev.video_url} preload="metadata" muted className="w-full h-full object-cover" />
        ) : customStart ? (
          <img src={customStart} alt="" className="w-full h-full object-cover" />
        ) : frame ? (
          <img src={frame} alt="" className="w-full h-full object-cover" />
        ) : state === "loading" ? (
          <Loader2 className="h-4 w-4 text-[#F2D543] animate-spin" />
        ) : (
          <X className="h-4 w-4 text-red-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <Mono className="text-[#DC569D]">{t("studio.continuing-from")} #{String(prev.position).padStart(2, "0")}{prev.duration ? ` · ${prev.duration}s` : ""}</Mono>
        <p className="text-[11px] text-gray-400 line-clamp-2 mt-0.5" title={prev.prompt}>{prev.prompt || t("studio.no-prompt")}</p>
        {!ready && <p className="text-[11px] text-[#F2D543] mt-0.5">{t("studio.prev-not-ready")}</p>}
        {ready && wantFrame && state === "loading" && <Mono className="block mt-0.5">{t("studio.prev-frame-loading")}</Mono>}
        {ready && wantFrame && state === "failed" && <p className="text-[11px] text-red-400 mt-0.5">{t("studio.prev-frame-failed")}</p>}
      </div>
    </div>
  );
}

function AssetPicker({ assets, selected, enabled, hint, onToggle }) {
  const { t } = useI18n();
  return (
    <div>
      <Mono>{t("studio.use-assets")}</Mono>
      <div className={`mt-1 flex flex-wrap gap-2 ${enabled ? "" : "opacity-40 pointer-events-none"}`}>
        {assets.map((a) => {
          const on = selected.includes(a.id);
          return (
            <button type="button" key={a.id} onClick={() => onToggle(a.id)} className={`relative h-14 w-14 rounded-lg overflow-hidden border-2 transition-colors ${on ? "border-[#DC569D] shadow-[0_0_12px_rgba(220,86,157,0.4)]" : "border-gray-800 opacity-60 hover:opacity-100"}`} title={a.name}>
              <img src={a.image_url} alt={a.name} className="w-full h-full object-cover" />
            </button>
          );
        })}
      </div>
      {hint}
    </div>
  );
}

/**
 * Crear/editar una toma. `shot` null = nueva. `prevShot` = toma de la que parte
 * (null si es la primera). `seed` = toma origen de "Continuar": hereda modelo/opciones/refs.
 */
export default function ShotEditorModal({ project, shot, prevShot, seed, onClose, onSaved }) {
  const { t } = useI18n();
  const [models, setModels] = useState([]);
  const readyAssets = (project.assets || []).filter((a) => a.status === "ready" && a.image_url);
  const base = shot || seed || {};
  const [form, setForm] = useState({
    prompt: shot?.prompt || "",
    // Con assets en el proyecto, por defecto un modelo que acepte referencias por imagen.
    model: base.model || (readyAssets.length ? "seedance-2.5" : "kling-v3"),
    duration: base.duration || 5,
    chain_mode: shot?.chain_mode || (prevShot ? "last_frame" : "none"),
    asset_ids: base.asset_ids || [],
    start_frame_url: shot?.start_frame_url || null,
    end_frame_url: shot?.end_frame_url || null,
    options: base.options || {},
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setOpt = (k, v) => set("options", { ...form.options, [k]: v });

  useEffect(() => { getVideoModels().then((all) => setModels(all.filter((m) => !HIDDEN_MODELS.includes(m.id)))); }, []);

  const model = useMemo(() => models.find((m) => m.id === form.model), [models, form.model]);
  const durations = durationsFor(model);
  const caps = capsFor(model);
  const support = { none: true, last_frame: true, extend: caps.extend, keyframes: caps.keyframes };
  const refModels = useMemo(() => models.filter((m) => capsFor(m).refs), [models]);
  const isFirst = !prevShot;
  const chained = form.chain_mode !== "none";
  // Con frame de arranque el backend omite las refs (kling-o3/seedance cambiarian de ruta y perderian el frame).
  const startsFromFrame = form.chain_mode === "last_frame" || form.chain_mode === "keyframes" || (form.chain_mode === "none" && !!form.start_frame_url);
  const refsEnabled = caps.refs && !startsFromFrame;
  const needsStart = NEEDS_START_IMAGE.includes(form.model) && form.chain_mode === "none" && !form.start_frame_url;

  // Si el modelo no soporta la duración, el modo o las opciones elegidas, corrige al primero válido.
  useEffect(() => {
    if (!model) return;
    if (durations.length && !durations.includes(Number(form.duration))) set("duration", durations[0]);
    if (!support[form.chain_mode]) set("chain_mode", isFirst ? "none" : "last_frame");
    const res = caps.resolutions.includes(form.options.resolution) ? form.options.resolution : caps.resolutions.at(-1);
    set("options", { resolution: res, generate_audio: caps.audio ? !!form.options.generate_audio : false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model]);

  const toggleAsset = (id) =>
    set("asset_ids", form.asset_ids.includes(id) ? form.asset_ids.filter((x) => x !== id) : [...form.asset_ids, id]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload = { ...form, duration: Number(form.duration), chain_mode: isFirst ? "none" : form.chain_mode, asset_ids: caps.refs ? form.asset_ids : [] };
      const saved = shot ? await updateShot(project.id, shot.id, payload) : await createShot(project.id, payload);
      onSaved(saved);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const refsHint = !caps.refs ? (
    <p className={`${HINT} flex flex-wrap items-center gap-1.5`}>
      {t("studio.refs-unsupported")}
      {refModels.map((m) => (
        <button type="button" key={m.id} onClick={() => set("model", m.id)} className="underline hover:text-white">{m.label}</button>
      ))}
    </p>
  ) : startsFromFrame && form.asset_ids.length > 0 ? (
    <p className={HINT}>{t("studio.refs-skipped-frame")}</p>
  ) : null;

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
          {project.style && <Mono className="block mt-1 normal-case tracking-normal text-gray-600">{t("studio.style-auto")}</Mono>}
        </div>

        {!isFirst && (
          <div>
            <Mono>{t("studio.chain")}</Mono>
            <div className="mt-1 grid grid-cols-4 gap-1 bg-[#0C0C0D] p-1 rounded-lg border border-gray-800">
              {CHAIN_MODES.map((m) => (
                <button
                  type="button"
                  key={m}
                  disabled={!support[m]}
                  onClick={() => set("chain_mode", m)}
                  className={`px-2 py-1.5 rounded-md text-xs transition-colors ${form.chain_mode === m ? "bg-[#DC569D] text-white" : "text-gray-400 hover:text-white hover:bg-[#2a2a2a]"} disabled:opacity-30 disabled:hover:bg-transparent`}
                  title={t(`studio.chain-${m}-hint`)}
                >
                  {t(`studio.chain-${m}`)}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-gray-500">{t(`studio.chain-${form.chain_mode}-hint`)}</p>
            {chained && <PrevShotPanel projectId={project.id} prev={prevShot} mode={form.chain_mode} customStart={form.chain_mode === "keyframes" ? form.start_frame_url : null} />}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Mono>{t("studio.model")}</Mono>
            <select value={form.model} onChange={(e) => set("model", e.target.value)} className={`${INPUT} mt-1`}>
              {models.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {CAP_KEYS.map((c) => (
                <Mono key={c} className={`px-1.5 py-0.5 rounded border ${caps[c] ? "border-[#DC569D]/40 text-[#DC569D]" : "border-gray-800 text-gray-700 line-through"}`}>
                  {t(`studio.cap-${c}`)}
                </Mono>
              ))}
            </div>
          </div>
          <div>
            <Mono>{t("studio.duration")}</Mono>
            <Segmented options={durations} value={Number(form.duration)} onChange={(d) => set("duration", d)} render={(d) => `${d}s`} />
          </div>
        </div>

        {(caps.resolutions.length > 0 || caps.audio) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {caps.resolutions.length > 0 && (
              <div>
                <Mono>{t("studio.resolution")}</Mono>
                <Segmented options={caps.resolutions} value={form.options.resolution} onChange={(r) => setOpt("resolution", r)} />
              </div>
            )}
            {caps.audio && (
              <div>
                <Mono>{t("studio.audio")}</Mono>
                <button type="button" onClick={() => setOpt("generate_audio", !form.options.generate_audio)} className={`mt-1 flex items-center gap-2 px-2.5 py-1.5 rounded-md font-mono text-xs transition-colors ${form.options.generate_audio ? "bg-[#DC569D] text-white" : "bg-[#2f2f2f] text-gray-400 hover:bg-[#3a3a3a] hover:text-white"}`}>
                  <Volume2 className="h-3.5 w-3.5" />
                  {form.options.generate_audio ? "ON" : "OFF"}
                </button>
              </div>
            )}
          </div>
        )}

        {(form.chain_mode === "none" || form.chain_mode === "keyframes") && (
          <div>
            <FrameInput label={form.chain_mode === "keyframes" ? t("studio.start-frame-optional") : t("studio.start-frame")} value={form.start_frame_url} onChange={(v) => set("start_frame_url", v)} />
            {needsStart && <p className={HINT}>{t("studio.needs-start-image")}</p>}
          </div>
        )}
        {form.chain_mode === "keyframes" && (
          <FrameInput label={t("studio.end-frame")} value={form.end_frame_url} onChange={(v) => set("end_frame_url", v)} />
        )}

        {readyAssets.length > 0 && (
          <AssetPicker assets={readyAssets} selected={form.asset_ids} enabled={refsEnabled} hint={refsHint} onToggle={toggleAsset} />
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
