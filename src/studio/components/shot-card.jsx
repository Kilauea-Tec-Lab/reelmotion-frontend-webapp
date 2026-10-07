import { ArrowLeft, ArrowRight, Film, FastForward, Loader2, Pencil, Play, RefreshCw, Sparkles, StepForward, Trash2 } from "lucide-react";
import { useI18n } from "../../i18n/i18n-context";
import { Mono, StatusDot } from "./ui";
import { BUSY, CARD } from "./tokens";

const SMALL = "flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-md bg-[#2f2f2f] text-gray-300 text-[11px] hover:bg-[#3a3a3a] hover:text-white disabled:opacity-40 transition-colors";

export default function ShotCard({ shot, isFirst, isLast, onGenerate, onContinue, onExtend, onEditVideo, onEdit, onPreview, onDelete, onMove, generating }) {
  const { t } = useI18n();
  const busy = BUSY.includes(shot.status) || generating;
  const done = shot.status === "completed" && !!shot.video_url;
  const imported = shot.kind === "import";

  return (
    <div className={`${CARD} w-56 shrink-0 flex flex-col overflow-hidden ${shot.status === "failed" ? "border-red-900/60" : ""}`}>
      <div
        className="aspect-video bg-[#0C0C0D] relative cursor-pointer group"
        onClick={() => shot.video_url && onPreview(shot)}
      >
        {shot.video_url ? (
          <>
            <video src={shot.video_url} preload="metadata" muted className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
              <Play className="h-8 w-8 text-white" />
            </div>
          </>
        ) : shot.start_frame_url ? (
          <img src={shot.start_frame_url} alt="" className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {busy ? <Loader2 className="h-6 w-6 text-[#F2D543] animate-spin" /> : <Sparkles className="h-6 w-6 text-gray-700" />}
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          <span className="bg-black/70 rounded px-1.5 py-0.5"><Mono className="text-gray-300">#{String(shot.position).padStart(2, "0")}</Mono></span>
          {shot.kind && shot.kind !== "generate" && (
            <span className="bg-[#DC569D]/80 rounded px-1.5 py-0.5"><Mono className="text-white">{t(`studio.kind-${shot.kind}`)}</Mono></span>
          )}
        </div>
        {!shot.video_url && shot.end_frame_url && (
          <img src={shot.end_frame_url} alt="" title={t("studio.end-frame")} className="absolute bottom-2 left-2 h-8 w-14 object-cover rounded border border-gray-700" />
        )}
        {shot.duration && (
          <div className="absolute bottom-2 right-2 bg-black/70 rounded px-1.5 py-0.5">
            <Mono className="text-gray-300">{shot.duration}s</Mono>
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1">
        <p className="text-xs text-gray-300 line-clamp-2 min-h-[2rem]" title={shot.prompt}>
          {shot.prompt || <span className="text-gray-600 italic">{t("studio.no-prompt")}</span>}
        </p>
        <div className="flex items-center justify-between">
          <StatusDot status={shot.status} label={t(`studio.status-${shot.status}`)} />
          <Mono className="truncate max-w-[6rem]">{imported ? t("studio.kind-import") : shot.model || "—"}</Mono>
        </div>
        {shot.status === "failed" && shot.error && (
          <p className="text-[11px] text-red-400 line-clamp-2" title={shot.error}>{shot.error}</p>
        )}
        {done && (
          <div className="mt-auto flex gap-1">
            <button onClick={() => onExtend(shot)} disabled={busy} className={SMALL} title={t("studio.extend-hint")}>
              <FastForward className="h-3 w-3" />{t("studio.chain-extend")}
            </button>
            <button onClick={() => onEditVideo(shot)} disabled={busy} className={SMALL} title={t("studio.edit-video-hint")}>
              <Film className="h-3 w-3" />{t("studio.edit-video")}
            </button>
          </div>
        )}
        <div className={`${done ? "" : "mt-auto "}flex items-center gap-1 pt-1 border-t border-gray-800`}>
          {/* Toma lista: la accion principal es continuarla; regenerar pasa a icono. */}
          {done ? (
            <>
              <button
                onClick={() => onContinue(shot)}
                disabled={busy}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-[#DC569D] text-white text-xs hover:bg-[#c44a87] disabled:opacity-50 transition-colors"
                title={t("studio.continue-hint")}
              >
                <StepForward className="h-3.5 w-3.5" />
                {t("studio.continue")}
              </button>
              {!imported && (
                <button onClick={() => onGenerate(shot)} disabled={busy} className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-[#2a2a2a] disabled:opacity-40" title={t("studio.regenerate")}>
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                </button>
              )}
            </>
          ) : (
            <button
              onClick={() => onGenerate(shot)}
              disabled={busy}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-[#DC569D] text-white text-xs hover:bg-[#c44a87] disabled:opacity-50 transition-colors"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {t("studio.generate")}
            </button>
          )}
          {!imported && (
            <button onClick={() => onEdit(shot)} disabled={busy} className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-[#2a2a2a] disabled:opacity-40" title={t("studio.edit")}>
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={() => onMove(shot, -1)} disabled={isFirst || busy} className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-[#2a2a2a] disabled:opacity-30">
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onMove(shot, 1)} disabled={isLast || busy} className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-[#2a2a2a] disabled:opacity-30">
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onDelete(shot)} disabled={busy} className="p-1.5 rounded-md text-gray-400 hover:text-red-400 hover:bg-[#2a2a2a] disabled:opacity-40" title={t("studio.delete")}>
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
