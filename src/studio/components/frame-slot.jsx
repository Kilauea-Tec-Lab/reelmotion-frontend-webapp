import { useEffect, useRef, useState } from "react";
import { Images, Loader2, Sparkles, Upload, X } from "lucide-react";
import { useI18n } from "../../i18n/i18n-context";
import { uploadImage } from "../functions";
import { Mono } from "./ui";

const BTN = "flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#2f2f2f] text-gray-300 text-[11px] hover:bg-[#3a3a3a] hover:text-white disabled:opacity-40 transition-colors";

/**
 * Slot de frame (inicial o final): subir imagen, elegir un asset o generar un keyframe
 * con los personajes seleccionados. El keyframe es un asset kind=frame que se genera en
 * segundo plano; el slot espera a que el asset quede listo y toma su URL.
 */
export default function FrameSlot({ label, hint, value, onChange, assets, placeholder, onGenerate, generateDisabled }) {
  const { t } = useI18n();
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const [pendingId, setPendingId] = useState(null);
  const [error, setError] = useState(null);

  const pending = pendingId ? assets.find((a) => a.id === pendingId) : null;
  useEffect(() => {
    if (!pending) return;
    if (pending.status === "ready" && pending.image_url) {
      onChange(pending.image_url);
      setPendingId(null);
    } else if (pending.status === "failed") {
      setError(t("studio.keyframe-failed"));
      setPendingId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending?.status, pending?.image_url]);

  const run = async (fn) => {
    setBusy(true);
    setError(null);
    try { await fn(); } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const upload = (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) run(async () => onChange(await uploadImage(f)));
  };
  const generate = () => run(async () => setPendingId((await onGenerate()).id));
  const picks = assets.filter((a) => a.status === "ready" && a.image_url && a.kind !== "video");
  const waiting = busy || !!pendingId;

  return (
    <div>
      <Mono>{label}</Mono>
      <div className="mt-1 flex gap-3 rounded-lg border border-gray-800 bg-[#0C0C0D] p-2">
        <div className="h-16 w-28 shrink-0 rounded overflow-hidden bg-black/40 border border-gray-800 flex items-center justify-center">
          {waiting ? (
            <Loader2 className="h-4 w-4 text-[#F2D543] animate-spin" />
          ) : value ? (
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : placeholder ? (
            <img src={placeholder} alt="" className="w-full h-full object-cover opacity-50" />
          ) : (
            <Mono className="text-gray-700">—</Mono>
          )}
        </div>
        <div className="min-w-0 flex-1 flex flex-col gap-1.5">
          <div className="flex flex-wrap gap-1.5">
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={upload} />
            <button type="button" disabled={waiting} onClick={() => fileRef.current?.click()} className={BTN}>
              <Upload className="h-3 w-3" /> {value ? t("studio.replace") : t("studio.upload-short")}
            </button>
            {picks.length > 0 && (
              <button type="button" disabled={waiting} onClick={() => setPicking((p) => !p)} className={BTN}>
                <Images className="h-3 w-3" /> {t("studio.from-assets")}
              </button>
            )}
            {onGenerate && (
              <button type="button" disabled={waiting || generateDisabled} onClick={generate} className={`${BTN} text-[#DC569D]`} title={t("studio.keyframe-hint")}>
                <Sparkles className="h-3 w-3" /> {t("studio.generate-keyframe")}
              </button>
            )}
            {value && !waiting && (
              <button type="button" onClick={() => onChange(null)} className="p-1 text-gray-500 hover:text-white" title={t("studio.remove")}>
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {pendingId && <Mono className="normal-case tracking-normal text-[#F2D543]">{t("studio.keyframe-generating")}</Mono>}
          {hint && !pendingId && <p className="text-[11px] text-gray-500">{hint}</p>}
          {error && <p className="text-[11px] text-red-400">{error}</p>}
        </div>
      </div>
      {picking && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {picks.map((a) => (
            <button type="button" key={a.id} onClick={() => { onChange(a.image_url); setPicking(false); }} title={a.name} className="h-12 w-20 rounded overflow-hidden border border-gray-800 hover:border-[#DC569D]">
              <img src={a.image_url} alt={a.name} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
