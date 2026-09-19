import { ArrowLeft, ArrowRight, Loader2, Pencil, Play, Sparkles, Trash2 } from "lucide-react";
import { useI18n } from "../../i18n/i18n-context";
import { Mono, StatusDot } from "./ui";
import { CARD } from "./tokens";

const BUSY = ["queued", "processing"];

export default function ShotCard({ shot, isFirst, isLast, onGenerate, onEdit, onPreview, onDelete, onMove, generating }) {
  const { t } = useI18n();
  const busy = BUSY.includes(shot.status) || generating;

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
        <div className="absolute top-2 left-2 bg-black/70 rounded px-1.5 py-0.5">
          <Mono className="text-gray-300">#{String(shot.position).padStart(2, "0")}</Mono>
        </div>
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
          <Mono className="truncate max-w-[6rem]">{shot.model || "—"}</Mono>
        </div>
        {shot.status === "failed" && shot.error && (
          <p className="text-[11px] text-red-400 line-clamp-2" title={shot.error}>{shot.error}</p>
        )}
        <div className="mt-auto flex items-center gap-1 pt-1 border-t border-gray-800">
          <button
            onClick={() => onGenerate(shot)}
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-[#DC569D] text-white text-xs hover:bg-[#c44a87] disabled:opacity-50 transition-colors"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {shot.video_url ? t("studio.regenerate") : t("studio.generate")}
          </button>
          <button onClick={() => onEdit(shot)} disabled={busy} className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-[#2a2a2a] disabled:opacity-40" title={t("studio.edit")}>
            <Pencil className="h-3.5 w-3.5" />
          </button>
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
