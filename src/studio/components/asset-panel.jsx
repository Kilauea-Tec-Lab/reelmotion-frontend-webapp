import { useEffect, useMemo, useRef, useState } from "react";
import { Clapperboard, Film, ImagePlus, Loader2, Plus, RefreshCw, Sparkles, Trash2, Upload, User, Image as ImageIcon, X } from "lucide-react";
import { useI18n } from "../../i18n/i18n-context";
import { addVideoAsset, createAsset, deleteAsset, getCapabilities, MAX_VIDEO_SECONDS, regenerateAsset, uploadImage } from "../functions";
import { ConfirmDelete, Modal, Mono, StatusDot } from "./ui";
import { BTN_PRIMARY, BTN_SECONDARY, INPUT } from "./tokens";

const MAX_REF_PHOTOS = 4;

/**
 * Añadir personaje / referencia: subir una imagen tal cual, o generarla con el modelo elegido.
 * Los personajes se generan como hoja de 3 vistas (frente, espalda, close-up) para que los
 * modelos de video mantengan la identidad; las fotos de referencia guían la generación.
 */
function AddAssetModal({ projectId, kind, onClose, onCreated }) {
  const { t } = useI18n();
  const fileRef = useRef(null);
  const refsRef = useRef(null);
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState(null);
  const [refPhotos, setRefPhotos] = useState([]); // URLs ya subidas
  const [imageModels, setImageModels] = useState([]);
  const [model, setModel] = useState("nano-banana-2");
  const [sheet, setSheet] = useState(kind === "character");
  const [busy, setBusy] = useState(false);
  const [uploadingRefs, setUploadingRefs] = useState(false);
  const [error, setError] = useState(null);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);
  useEffect(() => { getCapabilities().then((c) => setImageModels(c.image)).catch(() => {}); }, []);

  const addRefPhotos = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, MAX_REF_PHOTOS - refPhotos.length);
    e.target.value = "";
    if (!files.length) return;
    setUploadingRefs(true);
    setError(null);
    try {
      const urls = await Promise.all(files.map(uploadImage));
      setRefPhotos((r) => [...r, ...urls]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingRefs(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const data = file
        ? { kind, name, image_url: await uploadImage(file) }
        : { kind, name, prompt, model, sheet: kind === "character" ? sheet : undefined, reference_image_urls: refPhotos };
      onCreated(await createAsset(projectId, data));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal onClose={() => !busy && onClose()} dismissable={false}>
      <form onSubmit={submit} className="space-y-4">
        <h3 className="text-lg font-semibold text-white">{t(`studio.add-${kind}`)}</h3>
        <div>
          <Mono>{t("studio.name")}</Mono>
          <input autoFocus required value={name} onChange={(e) => setName(e.target.value)} className={`${INPUT} mt-1`} />
        </div>
        <div>
          <Mono>{t("studio.upload")}</Mono>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <button type="button" onClick={() => fileRef.current?.click()} className={`${BTN_SECONDARY} mt-1 w-full flex items-center justify-center gap-2`}>
            <Upload className="h-4 w-4 shrink-0" />
            <span className="truncate">{file ? file.name : t("studio.pick-image")}</span>
          </button>
          {preview && (
            <div className="mt-2 relative rounded-lg overflow-hidden border border-gray-800 bg-[#0C0C0D]">
              <img src={preview} alt="" className="w-full max-h-48 object-contain" />
              <button type="button" onClick={() => { setFile(null); fileRef.current.value = ""; }} className="absolute top-1 right-1 bg-black/70 rounded p-1 text-gray-300 hover:text-red-400">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2"><div className="flex-1 h-px bg-gray-800" /><Mono>{t("studio.or")}</Mono><div className="flex-1 h-px bg-gray-800" /></div>
        <fieldset disabled={!!file} className="space-y-3 disabled:opacity-40">
          <div>
            <Mono>{t("studio.generate-from-prompt")}</Mono>
            <textarea rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={t(`studio.asset-prompt-hint-${kind}`)} className={`${INPUT} mt-1 resize-none`} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Mono>{t("studio.image-model")}</Mono>
              <select value={model} onChange={(e) => setModel(e.target.value)} className={`${INPUT} mt-1`}>
                {(imageModels.length ? imageModels : [{ id: "nano-banana-2", label: "Nano Banana 2" }]).map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </div>
            {kind === "character" && (
              <label className="flex items-start gap-2 mt-5 cursor-pointer select-none">
                <input type="checkbox" checked={sheet} onChange={(e) => setSheet(e.target.checked)} className="mt-0.5 accent-[#DC569D]" />
                <span className="text-xs text-gray-300">{t("studio.character-sheet")}<span className="block text-[11px] text-gray-500">{t("studio.character-sheet-hint")}</span></span>
              </label>
            )}
          </div>
          <div>
            <Mono>{t("studio.ref-photos")} · {refPhotos.length}/{MAX_REF_PHOTOS}</Mono>
            <div className="mt-1 flex flex-wrap gap-2">
              {refPhotos.map((u) => (
                <div key={u} className="relative h-14 w-14 rounded-lg overflow-hidden border border-gray-800">
                  <img src={u} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setRefPhotos((r) => r.filter((x) => x !== u))} className="absolute top-0.5 right-0.5 bg-black/70 rounded p-0.5 text-gray-300 hover:text-red-400"><X className="h-3 w-3" /></button>
                </div>
              ))}
              {refPhotos.length < MAX_REF_PHOTOS && (
                <>
                  <input ref={refsRef} type="file" accept="image/*" multiple hidden onChange={addRefPhotos} />
                  <button type="button" onClick={() => refsRef.current?.click()} disabled={uploadingRefs} className="h-14 w-14 rounded-lg border border-dashed border-gray-700 hover:border-[#DC569D]/70 flex items-center justify-center text-gray-500 hover:text-white">
                    {uploadingRefs ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                  </button>
                </>
              )}
            </div>
            <p className="mt-1 text-[11px] text-gray-500">{t("studio.ref-photos-hint")}</p>
          </div>
        </fieldset>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} disabled={busy} className={BTN_SECONDARY}>{t("studio.cancel")}</button>
          <button type="submit" disabled={busy || uploadingRefs || !name.trim() || (!file && !prompt.trim())} className={BTN_PRIMARY}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : file ? <Plus className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            {file ? t("studio.add") : t("studio.generate")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AssetTile({ a, onDelete, onRegenerate, actions }) {
  const { t } = useI18n();
  const canRegen = a.prompt && a.kind !== "video" && a.status !== "generating";
  return (
    <div className="group relative aspect-square rounded-lg overflow-hidden bg-[#0C0C0D] border border-gray-800 hover:border-[#DC569D]/60 transition-colors">
      {a.kind === "video" ? (
        <video src={a.video_url} preload="metadata" muted className="w-full h-full object-cover" />
      ) : a.image_url ? (
        <img src={a.image_url} alt={a.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          {a.status === "generating" ? <Loader2 className="h-4 w-4 text-[#F2D543] animate-spin" /> : <span className="text-red-400 text-[10px]">✕</span>}
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-1.5 pt-4 pb-1">
        <p className="text-[10px] text-white truncate">{a.name}{a.duration ? ` · ${Math.round(a.duration)}s` : ""}</p>
      </div>
      <div className="absolute top-1 left-1"><StatusDot status={a.status} /></div>
      <div className="absolute top-1 right-1 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        {actions}
        {canRegen && (
          <button onClick={() => onRegenerate(a)} className="bg-black/70 rounded p-1 text-gray-300 hover:text-[#F2D543]" title={t("studio.regenerate")}>
            <RefreshCw className="h-3 w-3" />
          </button>
        )}
        <button onClick={() => onDelete(a)} className="bg-black/70 rounded p-1 text-gray-300 hover:text-red-400" title={t("studio.delete")}>
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function AssetGroup({ group, icon, assets, onAdd, addBusy, renderTile }) {
  const { t } = useI18n();
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <Mono className="text-gray-400">{t(`studio.${group}s`)}</Mono>
          <Mono>{assets.length}</Mono>
        </div>
        {onAdd && (
          <button onClick={onAdd} disabled={addBusy} className="p-1 rounded text-gray-500 hover:text-white hover:bg-[#2a2a2a]" title={t(`studio.add-${group}`)}>
            {addBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </button>
        )}
      </div>
      {assets.length === 0 ? (
        onAdd && (
          <button onClick={onAdd} disabled={addBusy} className="w-full rounded-lg border border-dashed border-gray-800 hover:border-[#DC569D]/60 py-4 flex flex-col items-center gap-1 text-gray-600 hover:text-gray-300 transition-colors">
            <ImagePlus className="h-5 w-5" />
            <span className="text-xs">{t(`studio.empty-${group}s`)}</span>
          </button>
        )
      ) : (
        <div className="grid grid-cols-3 gap-2">{assets.map(renderTile)}</div>
      )}
    </div>
  );
}

export default function AssetPanel({ project, onChange, onImportVideo, onEditVideo, onClose }) {
  const { t } = useI18n();
  const videoRef = useRef(null);
  const [adding, setAdding] = useState(null); // kind | null
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [error, setError] = useState(null);
  const assets = project.assets || [];
  const ofKind = (...kinds) => assets.filter((a) => kinds.includes(a.kind));

  const guard = async (fn) => {
    setError(null);
    try { await fn(); } catch (err) { setError(err.message === "too-long" ? t("studio.video-too-long", { max: MAX_VIDEO_SECONDS }) : err.message); }
  };
  const confirmDelete = () => guard(async () => {
    setDeleting(true);
    try {
      await deleteAsset(project.id, toDelete.id);
      setToDelete(null);
      onChange();
    } finally {
      setDeleting(false);
    }
  });
  const regenerate = (a) => guard(async () => { await regenerateAsset(project.id, a.id); onChange(); });
  const uploadVideo = (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    guard(async () => {
      setUploadingVideo(true);
      try { await addVideoAsset(project.id, f); onChange(); } finally { setUploadingVideo(false); }
    });
  };

  const tile = (a, actions) => <AssetTile key={a.id} a={a} onDelete={setToDelete} onRegenerate={regenerate} actions={actions} />;
  const videoTile = (a) => tile(a, (
    <>
      <button onClick={() => guard(() => onImportVideo(a))} className="bg-black/70 rounded p-1 text-gray-300 hover:text-white" title={t("studio.add-to-timeline")}><Clapperboard className="h-3 w-3" /></button>
      <button onClick={() => onEditVideo(a)} className="bg-black/70 rounded p-1 text-gray-300 hover:text-[#DC569D]" title={t("studio.edit-video")}><Film className="h-3 w-3" /></button>
    </>
  ));

  return (
    <aside className="w-72 h-full shrink-0 bg-[#171717] border-r border-gray-800 flex flex-col min-h-0">
      <div className="px-4 h-12 flex items-center justify-between border-b border-gray-800 shrink-0">
        <Mono className="text-gray-300 truncate">{project.name}</Mono>
        {onClose && <button onClick={onClose} className="lg:hidden p-1 text-gray-400 hover:text-white"><X className="h-4 w-4" /></button>}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {error && <p className="text-[11px] text-red-400">{error}</p>}
        <AssetGroup group="character" icon={<User className="h-3.5 w-3.5 text-[#DC569D]" />} assets={ofKind("character")} onAdd={() => setAdding("character")} renderTile={(a) => tile(a)} />
        <AssetGroup group="reference" icon={<ImageIcon className="h-3.5 w-3.5 text-[#DC569D]" />} assets={ofKind("reference", "location")} onAdd={() => setAdding("reference")} renderTile={(a) => tile(a)} />
        <div>
          <input ref={videoRef} type="file" accept="video/*,.mov,.mp4,.webm,.m4v" hidden onChange={uploadVideo} />
          <AssetGroup group="video" icon={<Film className="h-3.5 w-3.5 text-[#DC569D]" />} assets={ofKind("video")} onAdd={() => videoRef.current?.click()} addBusy={uploadingVideo} renderTile={videoTile} />
          <p className="mt-1.5 text-[11px] text-gray-600">{t("studio.upload-video-hint", { max: MAX_VIDEO_SECONDS })}</p>
        </div>
        {ofKind("frame").length > 0 && (
          <AssetGroup group="keyframe" icon={<Sparkles className="h-3.5 w-3.5 text-[#DC569D]" />} assets={ofKind("frame")} renderTile={(a) => tile(a)} />
        )}
      </div>
      {adding && (
        <AddAssetModal projectId={project.id} kind={adding} onClose={() => setAdding(null)} onCreated={() => { setAdding(null); onChange(); }} />
      )}
      {toDelete && (
        <ConfirmDelete title={t("studio.delete-asset-title")} body={t("studio.delete-asset-confirm", { name: toDelete.name })} busy={deleting} onCancel={() => setToDelete(null)} onConfirm={confirmDelete} />
      )}
    </aside>
  );
}
