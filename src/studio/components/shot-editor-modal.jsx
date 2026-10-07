import { useEffect, useRef, useState } from "react";
import { Film, Loader2, Save, Sparkles, Volume2, X } from "lucide-react";
import { useI18n } from "../../i18n/i18n-context";
import { createAsset, createShot, getCapabilities, getShotLastFrame, updateShot } from "../functions";
import { Modal, Mono } from "./ui";
import { BTN_PRIMARY, BTN_SECONDARY, INPUT } from "./tokens";
import FrameSlot from "./frame-slot";
import EditVideoFields from "./edit-video-fields";

const PRESETS = [3, 4, 5, 8, 10, 15, 20, 30];
const CHAIN_MODES = ["none", "last_frame", "extend"];
const CAP_KEYS = ["refs", "keyframes", "extend", "audio"];
const MAX_PICK = 9;
const HINT = "mt-1.5 text-[11px] text-[#F2D543]";

// Seedance trae 4..30 s: se muestran solo los presets para no llenar el modal de botones.
const durationsFor = (cap) => (cap?.durations?.length > 8 ? cap.durations.filter((d) => PRESETS.includes(d)) : cap?.durations || []);
const hasCap = (cap, key) => !!cap && {
  refs: cap.max_refs > 0,
  keyframes: cap.end_frame,
  extend: cap.extend,
  audio: cap.audio || cap.native_audio,
}[key];

/** Ajusta duración/continuidad/opciones a lo que soporta el modelo (sin perder el resto del form). */
function fitToModel(f, cap) {
  if (!cap) return f;
  const durs = durationsFor(cap);
  const duration = !durs.length || durs.includes(Number(f.duration)) ? f.duration : (durs.includes(5) ? 5 : durs[0]);
  const res = cap.resolutions.includes(f.options.resolution) ? f.options.resolution
    : cap.resolutions.includes("1080p") ? "1080p" : cap.resolutions.at(-1);
  return {
    ...f,
    duration,
    chain_mode: f.chain_mode === "extend" && !cap.extend ? "last_frame" : f.chain_mode,
    options: { ...f.options, resolution: res, generate_audio: cap.audio ? !!f.options.generate_audio : false },
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

/** Toma de la que parte esta (último frame o video completo si es "extend"). */
function PrevShotPanel({ prev, mode }) {
  const { t } = useI18n();
  const ready = prev?.status === "completed" && !!prev.video_url;
  return (
    <div className="mt-2 flex gap-3 rounded-lg border border-[#DC569D]/30 bg-[#DC569D]/5 p-2">
      <div className="h-12 w-20 shrink-0 rounded overflow-hidden bg-[#0C0C0D] border border-gray-800 flex items-center justify-center">
        {ready ? <video src={prev.video_url} preload="metadata" muted className="w-full h-full object-cover" /> : <Mono className="text-gray-600">#{String(prev.position).padStart(2, "0")}</Mono>}
      </div>
      <div className="min-w-0 flex-1">
        <Mono className="text-[#DC569D]">{t("studio.continuing-from")} #{String(prev.position).padStart(2, "0")}{prev.duration ? ` · ${prev.duration}s` : ""} · {t(`studio.chain-${mode}`)}</Mono>
        <p className="text-[11px] text-gray-400 line-clamp-2 mt-0.5" title={prev.prompt}>{prev.prompt || t("studio.no-prompt")}</p>
        {!ready && <p className="text-[11px] text-[#F2D543] mt-0.5">{t("studio.prev-not-ready")}</p>}
      </div>
    </div>
  );
}

function AssetPicker({ sectionRef, flash, assets, selected, max, hint, onToggle }) {
  const { t } = useI18n();
  return (
    <div ref={sectionRef} className={`rounded-lg transition-shadow ${flash ? "shadow-[0_0_0_2px_rgba(220,86,157,0.7)]" : ""}`}>
      <Mono>{t("studio.use-assets")} · {selected.length}/{max}</Mono>
      {assets.length === 0 ? (
        <p className="mt-1 text-[11px] text-gray-500">{t("studio.no-assets-yet")}</p>
      ) : (
        <div className="mt-1 flex flex-wrap gap-2">
          {assets.map((a) => {
            const on = selected.includes(a.id);
            return (
              <button type="button" key={a.id} onClick={() => onToggle(a.id)} disabled={!on && selected.length >= max} className={`relative h-14 w-14 rounded-lg overflow-hidden border-2 transition-colors disabled:opacity-30 ${on ? "border-[#DC569D] shadow-[0_0_12px_rgba(220,86,157,0.4)]" : "border-gray-800 opacity-60 hover:opacity-100"}`} title={a.name}>
                <img src={a.image_url} alt={a.name} className="w-full h-full object-cover" />
              </button>
            );
          })}
        </div>
      )}
      {hint}
    </div>
  );
}

/**
 * Crear/editar una toma. Dos pestañas: Generar (prompt + frames + refs) y Editar video
 * (estilo Genjutsu). `prevShot` = toma de la que parte (null si es la primera), `seed` =
 * toma origen de "Continuar" (hereda modelo/opciones/refs), `initial` = valores de arranque
 * (p. ej. { chain_mode: "extend" } o { kind: "edit", source }).
 */
export default function ShotEditorModal({ project, shot, prevShot, seed, initial = {}, onClose, onSaved, onAssetsChanged }) {
  const { t } = useI18n();
  const [caps, setCaps] = useState(null);
  const assets = project.assets || [];
  const refAssets = assets.filter((a) => a.status === "ready" && a.image_url && a.kind !== "frame" && a.kind !== "video");
  const base = shot || seed || {};
  const [kind, setKind] = useState(shot?.kind === "edit" ? "edit" : initial.kind || "generate");
  const [form, setForm] = useState({
    prompt: shot?.prompt || "",
    model: initial.model || base.model || (refAssets.length ? "seedance-2.5" : "kling-v3"),
    duration: base.duration || 5,
    // "keyframes" (tomas viejas) = último frame + frame final: hoy el final va en cualquier modo.
    chain_mode: initial.chain_mode || (shot?.chain_mode === "keyframes" ? "last_frame" : shot?.chain_mode) || (prevShot ? "last_frame" : "none"),
    asset_ids: base.asset_ids || [],
    start_frame_url: shot?.start_frame_url || null,
    end_frame_url: shot?.end_frame_url || null,
    options: base.options || {},
    edit_mode: shot?.edit_mode || "motion_transfer",
    source_video_url: shot?.source_video_url || initial.source?.url || null,
    source_duration: shot?.source_duration ?? initial.source?.duration ?? null,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [capHint, setCapHint] = useState(null);
  const [flash, setFlash] = useState(null);
  const refsRef = useRef(null);
  const framesRef = useRef(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setOpt = (k, v) => setForm((f) => ({ ...f, options: { ...f.options, [k]: v } }));

  useEffect(() => {
    getCapabilities()
      .then((c) => {
        setCaps(c);
        // Toma nueva: ajusta los valores por defecto al modelo. Una existente se respeta tal cual.
        // Si el modelo por defecto no admite el aspect del proyecto (p. ej. Kling en 4:3), usa el primero que sí.
        if (!shot) {
          setForm((f) => {
            const fits = (m) => !project.aspect_ratio || m.aspect_ratios.includes(project.aspect_ratio);
            const cur = c.video.find((m) => m.id === f.model);
            const pick = cur && fits(cur) ? cur : c.video.find((m) => m.id === "seedance-2.5" && fits(m)) || c.video.find(fits) || cur;
            return fitToModel({ ...f, model: pick?.id || f.model }, pick);
          });
        }
      })
      .catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const models = caps?.video || [];
  const editModels = models.filter((m) => m.edit);
  const cap = models.find((m) => m.id === form.model);
  const fitsAspect = (m) => !project.aspect_ratio || m.aspect_ratios.includes(project.aspect_ratio);
  const isFirst = !prevShot;
  const chain = isFirst ? "none" : form.chain_mode;
  const prevReady = prevShot?.status === "completed" && !!prevShot.video_url;
  const hasStart = chain === "last_frame" || (chain === "none" && !!form.start_frame_url);
  const hasEnd = !!cap?.end_frame && chain !== "extend" && !!form.end_frame_url;

  // Edición: si el clip es más largo de lo que acepta el modelo elegido, cambia a uno que sí.
  useEffect(() => {
    if (kind !== "edit" || !editModels.length) return;
    const ok = (m) => !(form.source_duration > m.edit_max_seconds + 0.5);
    if (!editModels.some((m) => m.id === form.model && ok(m))) {
      const next = editModels.find(ok);
      if (next) set("model", next.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, form.source_duration, editModels.length]);

  const changeModel = (id) => {
    setCapHint(null);
    setForm((f) => fitToModel({ ...f, model: id }, models.find((m) => m.id === id)));
  };
  const switchKind = (k) => {
    setKind(k);
    setCapHint(null);
    if (k === "edit" && !cap?.edit && editModels[0]) set("model", editModels[0].id);
  };
  const pulse = (ref, key) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setFlash(key);
    setTimeout(() => setFlash(null), 1200);
  };

  // Chips de capacidades: si el modelo la soporta, la activan o llevan a su sección; si no, dicen qué modelos sí.
  const onChip = (c) => {
    if (!hasCap(cap, c)) return setCapHint(c);
    setCapHint(null);
    if (c === "refs") pulse(refsRef, "refs");
    if (c === "keyframes") {
      if (chain === "extend") set("chain_mode", isFirst ? "none" : "last_frame");
      pulse(framesRef, "frames");
    }
    if (c === "extend") {
      if (isFirst) return setCapHint("extend-first");
      set("chain_mode", "extend");
    }
    if (c === "audio") {
      if (cap.native_audio && !cap.audio) return setCapHint("audio-native");
      setOpt("generate_audio", !form.options.generate_audio);
    }
  };
  const chipActive = (c) => ({
    refs: form.asset_ids.length > 0,
    keyframes: hasEnd,
    extend: chain === "extend",
    audio: !!form.options.generate_audio || (cap?.native_audio && !cap?.audio),
  })[c];

  const toggleAsset = (id) =>
    set("asset_ids", form.asset_ids.includes(id) ? form.asset_ids.filter((x) => x !== id) : [...form.asset_ids, id]);

  // Keyframe = asset kind=frame generado con el prompt de la toma + personajes seleccionados.
  const generateKeyframe = async (which) => {
    const refs = [];
    if (which === "start" && chain === "last_frame" && prevReady) refs.push(await getShotLastFrame(project.id, prevShot.id));
    if (which === "end" && form.start_frame_url) refs.push(form.start_frame_url);
    const prompt = which === "end" ? `Final moment of this shot: ${form.prompt}` : form.prompt;
    const asset = await createAsset(project.id, {
      kind: "frame",
      name: `${t(which === "end" ? "studio.end-frame" : "studio.start-frame")} · ${form.prompt.slice(0, 40)}`,
      prompt: prompt.slice(0, 2000),
      reference_asset_ids: form.asset_ids,
      reference_image_urls: refs,
    });
    onAssetsChanged?.();
    return asset;
  };

  let refsHint = null;
  if (kind === "generate" && cap) {
    const swap = (list) => list.filter(fitsAspect).map((m) => (
      <button type="button" key={m.id} onClick={() => changeModel(m.id)} className="underline hover:text-white">{m.label}</button>
    ));
    if (!cap.max_refs) {
      refsHint = <p className={`${HINT} flex flex-wrap items-center gap-1.5`}>{t("studio.refs-keyframe-only")} {swap(models.filter((m) => m.max_refs))}</p>;
    } else if (form.asset_ids.length && chain !== "extend") {
      const key = hasStart && !cap.refs_with_frame ? "refs-skipped-frame"
        : hasStart && hasEnd ? "refs-skipped-end"
        : !hasStart && !cap.refs_without_frame ? "refs-need-frame" : null;
      if (key) refsHint = <p className={HINT}>{t(`studio.${key}`, { model: cap.label })}</p>;
    }
  }

  const needsStart = kind === "generate" && cap?.needs_start && !hasStart && chain !== "extend";
  const endWithoutStart = kind === "generate" && hasEnd && !hasStart;
  const editNoSource = kind === "edit" && !form.source_video_url;
  const promptText = kind === "edit" && form.edit_mode === "restyle" && !form.prompt.trim() ? (project.style || "") : form.prompt;
  const canSave = !busy && cap && promptText.trim() && !needsStart && !endWithoutStart && !editNoSource;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSave) return;
    setBusy(true);
    setError(null);
    const payload = kind === "edit"
      ? {
        kind: "edit", prompt: promptText.trim(), model: form.model, edit_mode: form.edit_mode,
        source_video_url: form.source_video_url, source_duration: form.source_duration,
        asset_ids: form.asset_ids, options: { resolution: form.options.resolution },
      }
      : {
        kind: "generate", prompt: form.prompt.trim(), model: form.model, duration: Number(form.duration), chain_mode: chain,
        asset_ids: form.asset_ids,
        start_frame_url: chain === "extend" ? null : form.start_frame_url,
        end_frame_url: hasEnd ? form.end_frame_url : null,
        options: form.options,
      };
    try {
      const saved = shot ? await updateShot(project.id, shot.id, payload) : await createShot(project.id, payload);
      onSaved(saved);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const capHintText = capHint && (
    capHint === "extend-first" ? t("studio.cap-extend-first")
      : capHint === "audio-native" ? t("studio.cap-audio-native", { model: cap?.label })
      : (
        <span className="flex flex-wrap items-center gap-1.5">
          {t("studio.cap-unsupported", { model: cap?.label, cap: t(`studio.cap-${capHint}`) })}
          {models.filter((m) => hasCap(m, capHint) && fitsAspect(m)).map((m) => (
            <button type="button" key={m.id} onClick={() => changeModel(m.id)} className="underline hover:text-white">{m.label}</button>
          ))}
        </span>
      )
  );

  return (
    <Modal onClose={() => !busy && onClose()} wide dismissable={false}>
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">{shot ? t("studio.edit-shot") : t("studio.add-shot")}</h3>
          <div className="flex items-center gap-2">
            {shot && <Mono>#{String(shot.position).padStart(2, "0")}</Mono>}
            <button type="button" onClick={onClose} disabled={busy} className="p-1 text-gray-500 hover:text-white" aria-label={t("studio.cancel")}><X className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1 bg-[#0C0C0D] p-1 rounded-lg border border-gray-800">
          {["generate", "edit"].map((k) => (
            <button type="button" key={k} onClick={() => switchKind(k)} disabled={!!shot && shot.kind !== k && (shot.status !== "draft" && shot.status !== "failed")} className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs transition-colors disabled:opacity-30 ${kind === k ? "bg-[#DC569D] text-white" : "text-gray-400 hover:text-white hover:bg-[#2a2a2a]"}`}>
              {k === "edit" ? <Film className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}{t(`studio.tab-${k}`)}
            </button>
          ))}
        </div>

        {!caps && !error && <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 text-gray-500 animate-spin" /></div>}

        {caps && kind === "edit" && (
          <EditVideoFields project={project} shotId={shot?.id} form={form} set={set} editModels={editModels} onAssetsChanged={onAssetsChanged} />
        )}

        {caps && (
          <div>
            <Mono>{kind === "edit" ? t("studio.edit-prompt") : t("studio.prompt")}</Mono>
            <textarea autoFocus rows={kind === "edit" ? 3 : 4} value={form.prompt} onChange={(e) => set("prompt", e.target.value)} placeholder={t(kind === "edit" ? `studio.edit-${form.edit_mode}-placeholder` : "studio.prompt-hint")} className={`${INPUT} mt-1 resize-none`} />
            {project.style && <Mono className="block mt-1 normal-case tracking-normal text-gray-600">{t("studio.style-auto")}</Mono>}
          </div>
        )}

        {caps && kind === "generate" && (
          <>
            {!isFirst && (
              <div>
                <Mono>{t("studio.chain")}</Mono>
                <div className="mt-1 grid grid-cols-3 gap-1 bg-[#0C0C0D] p-1 rounded-lg border border-gray-800">
                  {CHAIN_MODES.map((m) => (
                    <button type="button" key={m} disabled={m === "extend" && !cap?.extend} onClick={() => set("chain_mode", m)} title={t(`studio.chain-${m}-hint`)} className={`px-2 py-1.5 rounded-md text-xs transition-colors ${chain === m ? "bg-[#DC569D] text-white" : "text-gray-400 hover:text-white hover:bg-[#2a2a2a]"} disabled:opacity-30 disabled:hover:bg-transparent`}>
                      {t(`studio.chain-${m}`)}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-[11px] text-gray-500">{t(`studio.chain-${chain}-hint`)}</p>
                {chain !== "none" && <PrevShotPanel prev={prevShot} mode={chain} />}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Mono>{t("studio.model")}</Mono>
                <select value={form.model} onChange={(e) => changeModel(e.target.value)} className={`${INPUT} mt-1`}>
                  {models.map((m) => (
                    <option key={m.id} value={m.id} disabled={!fitsAspect(m)}>{m.label}{fitsAspect(m) ? "" : ` — ${t("studio.aspect-unsupported", { aspect: project.aspect_ratio })}`}</option>
                  ))}
                </select>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {CAP_KEYS.map((c) => {
                    const ok = hasCap(cap, c);
                    return (
                      <button type="button" key={c} onClick={() => onChip(c)} title={t(`studio.cap-${c}-hint`)} className={`font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border transition-colors ${!ok ? "border-gray-800 text-gray-600 line-through hover:text-gray-400" : chipActive(c) ? "border-[#DC569D] bg-[#DC569D] text-white" : "border-[#DC569D]/40 text-[#DC569D] hover:bg-[#DC569D]/10"}`}>
                        {t(`studio.cap-${c}`)}
                      </button>
                    );
                  })}
                </div>
                {capHintText && <div className={HINT}>{capHintText}</div>}
              </div>
              <div>
                <Mono>{t("studio.duration")}</Mono>
                <Segmented options={durationsFor(cap)} value={Number(form.duration)} onChange={(d) => set("duration", d)} render={(d) => `${d}s`} />
              </div>
            </div>
          </>
        )}

        {cap && (cap.resolutions.length > 0 || (kind === "generate" && cap.audio)) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cap.resolutions.length > 0 && (
              <div>
                <Mono>{t("studio.resolution")}</Mono>
                <Segmented options={cap.resolutions} value={form.options.resolution} onChange={(r) => setOpt("resolution", r)} />
              </div>
            )}
            {kind === "generate" && cap.audio && (
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

        {cap && kind === "generate" && chain !== "extend" && (
          <div ref={framesRef} className={`grid grid-cols-1 gap-3 rounded-lg transition-shadow ${flash === "frames" ? "shadow-[0_0_0_2px_rgba(220,86,157,0.7)]" : ""}`}>
            <FrameSlot
              label={chain === "last_frame" ? t("studio.start-frame-chained") : t("studio.start-frame")}
              hint={chain === "last_frame" ? t("studio.start-frame-chained-hint") : undefined}
              value={form.start_frame_url}
              onChange={(v) => set("start_frame_url", v)}
              placeholder={chain === "last_frame" ? prevShot?.last_frame_url : null}
              assets={assets}
              onGenerate={() => generateKeyframe("start")}
              generateDisabled={!form.prompt.trim()}
            />
            {needsStart && <p className={HINT}>{t("studio.needs-start-image")}</p>}
            {cap.end_frame ? (
              <FrameSlot
                label={t("studio.end-frame")}
                hint={t("studio.end-frame-hint")}
                value={form.end_frame_url}
                onChange={(v) => set("end_frame_url", v)}
                assets={assets}
                onGenerate={() => generateKeyframe("end")}
                generateDisabled={!form.prompt.trim()}
              />
            ) : (
              <p className="text-[11px] text-gray-600">{t("studio.end-frame-unsupported", { model: cap.label })}</p>
            )}
            {endWithoutStart && <p className={HINT}>{t("studio.end-needs-start")}</p>}
          </div>
        )}

        {cap && (
          <AssetPicker
            sectionRef={refsRef}
            flash={flash === "refs"}
            assets={refAssets}
            selected={form.asset_ids}
            max={kind === "edit" ? cap.max_refs || MAX_PICK : MAX_PICK}
            hint={refsHint}
            onToggle={toggleAsset}
          />
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} disabled={busy} className={BTN_SECONDARY}>{t("studio.cancel")}</button>
          <button type="submit" disabled={!canSave} className={BTN_PRIMARY}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t("studio.save")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
