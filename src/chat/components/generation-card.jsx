import { ImageIcon, Film, AlertTriangle } from "lucide-react";
import { useI18n } from "../../i18n/i18n-context";

/**
 * ChatGPT-style placeholder shown in the conversation while an async image/video
 * generation is in flight. It fills an aspect-correct block (so it swaps in-place
 * for the real media without a layout jump), animates a shimmer sweep over a
 * dotted grid, and shows a shimmering "Generating…" label — no fake progress.
 *
 * It stays until the generation finishes; the parent then swaps it for the real
 * attachment (or leaves it in a failed/timeout state).
 */
function GenerationCard({
  mediaType = "video",
  provider = "",
  model = "",
  status = "processing",
  progress = null,
  error = null,
}) {
  const { t } = useI18n();

  const isVideo = mediaType === "video";
  const isKling = `${provider} ${model}`.toLowerCase().includes("kling");
  const isFailed = status === "failed";
  const isTimeout = status === "timeout";
  const frame = isVideo
    ? "aspect-video w-72 max-w-full"
    : "aspect-square w-56 max-w-full";

  if (isFailed || isTimeout) {
    return (
      <div
        className={`${frame} flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-center ${
          isFailed
            ? "border-red-500/40 bg-red-500/5"
            : "border-gray-700 bg-[#2a2a2a]"
        }`}
      >
        <AlertTriangle
          size={22}
          className={isFailed ? "text-red-400" : "text-gray-400"}
        />
        <p className="text-xs text-gray-200">
          {isFailed ? t("chat.generating.failed") : t("chat.generating.timeout")}
        </p>
        {isFailed && (
          <p className="text-[11px] text-gray-400">
            {t("chat.generating.refunded")}
          </p>
        )}
      </div>
    );
  }

  const hasProgress = typeof progress === "number" && progress >= 0;
  const label = isVideo
    ? t("chat.generating.video")
    : t("chat.generating.image");

  return (
    <div
      className={`${frame} relative overflow-hidden rounded-2xl bg-[#2a2a2a] ring-1 ring-white/5`}
    >
      {/* Dotted-grid backdrop (ChatGPT sketch placeholder look) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />

      {/* Indeterminate shimmer sweep across the whole placeholder */}
      <div className="animate-shimmer pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Centered status */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
        <div className="rounded-full bg-white/5 p-3 text-gray-300">
          {isVideo ? <Film size={22} /> : <ImageIcon size={22} />}
        </div>

        <p className="shimmer-text text-sm font-medium">{label}</p>

        {hasProgress && (
          <div className="w-4/5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-primarioLogo transition-[width] duration-500"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-gray-400">
              {Math.round(progress)}%
            </p>
          </div>
        )}

        {isKling && (
          <p className="text-[11px] leading-tight text-gray-400">
            {t("chat.generating.kling-note")}
          </p>
        )}
      </div>
    </div>
  );
}

export default GenerationCard;
