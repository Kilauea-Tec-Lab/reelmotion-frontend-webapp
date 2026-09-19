import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, Plus, Sparkles, Trash2, Upload, User, Image as ImageIcon } from "lucide-react";
import { useI18n } from "../../i18n/i18n-context";
import { createAsset, deleteAsset, uploadImage } from "../functions";
import { Modal, Mono, StatusDot } from "./ui";
import { BTN_PRIMARY, BTN_SECONDARY, INPUT } from "./tokens";

function AddAssetModal({ projectId, kind, onClose, onCreated }) {
  const { t } = useI18n();
  const fileRef = useRef(null);
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const image_url = file ? await uploadImage(file) : undefined;
      const asset = await createAsset(projectId, { kind, name, image_url, prompt: image_url ? undefined : prompt });
      onCreated(asset);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal onClose={() => !busy && onClose()}>
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
        <div>
          <Mono>{t("studio.generate-from-prompt")}</Mono>
          <textarea rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} disabled={!!file} placeholder={t("studio.asset-prompt-hint")} className={`${INPUT} mt-1 resize-none disabled:opacity-40`} />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} disabled={busy} className={BTN_SECONDARY}>{t("studio.cancel")}</button>
          <button type="submit" disabled={busy || !name.trim() || (!file && !prompt.trim())} className={BTN_PRIMARY}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : file ? <Plus className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            {file ? t("studio.add") : t("studio.generate")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AssetGroup({ kind, icon, assets, onAdd, onDelete }) {
  const { t } = useI18n();
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <Mono className="text-gray-400">{t(`studio.${kind}s`)}</Mono>
          <Mono>{assets.length}</Mono>
        </div>
        <button onClick={() => onAdd(kind)} className="p-1 rounded text-gray-500 hover:text-white hover:bg-[#2a2a2a]" title={t(`studio.add-${kind}`)}>
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {assets.length === 0 ? (
        <button onClick={() => onAdd(kind)} className="w-full rounded-lg border border-dashed border-gray-800 hover:border-[#DC569D]/60 py-4 flex flex-col items-center gap-1 text-gray-600 hover:text-gray-300 transition-colors">
          <ImagePlus className="h-5 w-5" />
          <span className="text-xs">{t(`studio.empty-${kind}s`)}</span>
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {assets.map((a) => (
            <div key={a.id} className="group relative aspect-square rounded-lg overflow-hidden bg-[#0C0C0D] border border-gray-800 hover:border-[#DC569D]/60 transition-colors">
              {a.image_url ? (
                <img src={a.image_url} alt={a.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {a.status === "generating" ? <Loader2 className="h-4 w-4 text-[#F2D543] animate-spin" /> : <span className="text-red-400 text-[10px]">✕</span>}
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-1.5 pt-4 pb-1">
                <p className="text-[10px] text-white truncate">{a.name}</p>
              </div>
              <div className="absolute top-1 left-1"><StatusDot status={a.status} /></div>
              <button onClick={() => onDelete(a)} className="absolute top-1 right-1 bg-black/70 rounded p-1 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AssetPanel({ project, onChange }) {
  const [adding, setAdding] = useState(null); // kind | null
  const assets = project.assets || [];

  const remove = async (asset) => {
    await deleteAsset(project.id, asset.id);
    onChange();
  };

  return (
    <aside className="w-72 shrink-0 bg-[#171717] border-r border-gray-800 flex flex-col min-h-0">
      <div className="px-4 h-12 flex items-center border-b border-gray-800 shrink-0">
        <Mono className="text-gray-300">{project.name}</Mono>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <AssetGroup kind="character" icon={<User className="h-3.5 w-3.5 text-[#DC569D]" />} assets={assets.filter((a) => a.kind === "character")} onAdd={setAdding} onDelete={remove} />
        <AssetGroup kind="reference" icon={<ImageIcon className="h-3.5 w-3.5 text-[#DC569D]" />} assets={assets.filter((a) => a.kind === "reference")} onAdd={setAdding} onDelete={remove} />
      </div>
      {adding && (
        <AddAssetModal
          projectId={project.id}
          kind={adding}
          onClose={() => setAdding(null)}
          onCreated={() => { setAdding(null); onChange(); }}
        />
      )}
    </aside>
  );
}
