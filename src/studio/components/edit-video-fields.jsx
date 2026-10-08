import { useRef, useState } from "react";
import { Film, Loader2, Upload } from "lucide-react";
import { useI18n } from "../../i18n/i18n-context";
import { addVideoAsset, MAX_VIDEO_SECONDS } from "../functions";
import { Mono } from "./ui";

const EDIT_MODES = ["motion_transfer", "restyle", "object_swap"];

function Choice({ active, onClick, disabled, children, title }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title} className={`px-2.5 py-1.5 rounded-md text-xs transition-colors disabled:opacity-30 ${active ? "bg-[#DC569D] text-white" : "bg-[#2f2f2f] text-gray-400 hover:bg-[#3a3a3a] hover:text-white"}`}>
      {children}
    </button>
  );
}

/**
 * Pestaña "Editar video" (estilo Higgsfield Genjutsu): video de origen (subido o de la
 * timeline) + modo + modelo de edición. Prompt, referencias y resolución los pone el modal.
 */
export default function EditVideoFields({ project, shotId, form, set, editModels, onAssetsChanged }) {
  const { t } = useI18n();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const sources = [
    ...(project.assets || []).filter((a) => a.kind === "video" && a.video_url).map((a) => ({ url: a.video_url, duration: a.duration, label: a.name })),
    ...(project.shots || []).filter((s) => s.id !== shotId && s.status === "completed" && s.video_url)
      .map((s) => ({ url: s.video_url, duration: s.duration, label: `#${String(s.position).padStart(2, "0")} ${s.prompt || ""}` })),
  ];
  const pickSource = (src) => {
    set("source_video_url", src.url);
    set("source_duration", src.duration ? Number(src.duration) : null);
  };

  const upload = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setUploading(true);
    setError(null);
    try {
      const asset = await addVideoAsset(project.id, f);
      pickSource({ url: asset.video_url, duration: asset.duration });
      onAssetsChanged();
    } catch (err) {
      setError(err.message === "too-long" ? t("studio.video-too-long", { max: MAX_VIDEO_SECONDS }) : err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div>
        <Mono>{t("studio.edit-source")}</Mono>
        <div className="mt-1 flex flex-wrap gap-2">
          {sources.map((src) => (
            <button type="button" key={src.url} onClick={() => pickSource(src)} title={src.label} className={`relative h-16 w-28 rounded-lg overflow-hidden border-2 transition-colors ${form.source_video_url === src.url ? "border-[#DC569D] shadow-[0_0_12px_rgba(220,86,157,0.4)]" : "border-gray-800 opacity-70 hover:opacity-100"}`}>
              <video src={src.url} preload="metadata" muted className="w-full h-full object-cover" />
              {src.duration && <span className="absolute bottom-0.5 right-1 font-mono text-[10px] text-white bg-black/70 px-1 rounded">{Math.round(src.duration)}s</span>}
            </button>
          ))}
          <input ref={fileRef} type="file" accept="video/*,.mov,.mp4,.webm,.m4v" hidden onChange={upload} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="h-16 w-28 rounded-lg border border-dashed border-gray-700 hover:border-[#DC569D]/70 flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-white text-[11px] transition-colors">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {t("studio.upload-video")}
          </button>
        </div>
        <p className="mt-1 text-[11px] text-gray-500">{t("studio.upload-video-hint", { max: MAX_VIDEO_SECONDS })}</p>
        {error && <p className="mt-1 text-[11px] text-red-400">{error}</p>}
      </div>

      <div>
        <Mono>{t("studio.edit-mode")}</Mono>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {EDIT_MODES.map((m) => (
            <Choice key={m} active={form.edit_mode === m} onClick={() => set("edit_mode", m)}>{t(`studio.edit-${m}`)}</Choice>
          ))}
        </div>
        <p className="mt-1 text-[11px] text-gray-500">{t(`studio.edit-${form.edit_mode}-hint`)}</p>
      </div>

      <div>
        <Mono>{t("studio.model")}</Mono>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {editModels.flatMap((m) => {
            const tooLong = form.source_duration > m.edit_max_seconds + 0.5;
            const wrongMode = m.motion_edit && form.edit_mode !== "motion_transfer";
            const title = tooLong ? t("studio.edit-too-long", { max: m.edit_max_seconds }) : wrongMode ? t("studio.edit-motion-only-transfer") : undefined;
            // Seedance 2.5 sale dos veces: edicion normal y "personaje" (frame compuesto + reference-to-video).
            const variants = m.motion_edit ? [[false, t("studio.edit-motion-model")]] : m.refs_without_frame ? [[false, m.label], [true, t("studio.edit-seedance-character")]] : [[false, m.label]];
            return variants.map(([swap, label]) => (
              <Choice key={`${m.id}-${swap}`} active={form.model === m.id && !!form.options.character_swap === swap} disabled={tooLong || wrongMode || (swap && form.edit_mode !== "motion_transfer")}
                onClick={() => { set("model", m.id); set("options", { ...form.options, character_swap: swap }); }} title={title}>
                <span className="inline-flex items-center gap-1.5"><Film className="h-3 w-3" />{label}{tooLong ? ` · ≤${m.edit_max_seconds}s` : ""}</span>
              </Choice>
            ));
          })}
        </div>
        {editModels.find((m) => m.id === form.model)?.motion_edit && (
          <p className="mt-1 text-[11px] text-gray-500">{t("studio.edit-motion-hint")}</p>
        )}
        {form.options.character_swap && editModels.find((m) => m.id === form.model)?.refs_without_frame && (
          <p className="mt-1 text-[11px] text-gray-500">{t("studio.edit-seedance-character-hint")}</p>
        )}
      </div>
    </>
  );
}
