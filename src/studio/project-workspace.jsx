import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLoaderData } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronUp, CreditCard, DollarSign, MessageSquare, PanelRightClose, PanelRightOpen, Users } from "lucide-react";
import { useI18n } from "../i18n/i18n-context";
import ChatView from "../chat/chat-view";
import ModalPreview from "../components/modal-preview";
import { useGenerationTracker } from "../chat/use-generation-tracker";
import { deleteShot, generateShot, getProject, getUserTokens, importShot, reorderShots, updateProject } from "./functions";
import AssetPanel from "./components/asset-panel";
import ShotTimeline from "./components/shot-timeline";
import ShotEditorModal from "./components/shot-editor-modal";
import { ConfirmDelete, Mono, StatusDot } from "./components/ui";
import { BUSY, INPUT } from "./components/tokens";

export default function ProjectWorkspace() {
  const { t } = useI18n();
  const { project: initial, chatData } = useLoaderData();
  const [project, setProject] = useState(initial);
  const [chatOpen, setChatOpen] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);
  const [editor, setEditor] = useState(null); // { shot, after?, initial? } (after = "continuar" desde esa toma)
  const [assetsOpen, setAssetsOpen] = useState(false); // drawer de assets en pantallas < lg
  const [tokens, setTokens] = useState(null);
  const [preview, setPreview] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [generatingIds, setGeneratingIds] = useState(new Set());
  const [toast, setToast] = useState(null);

  const shots = useMemo(() => project.shots || [], [project.shots]);

  const refreshTokens = useCallback(() => getUserTokens().then(setTokens).catch(() => {}), []);
  useEffect(() => { refreshTokens(); }, [refreshTokens]);

  const reload = useCallback(async () => {
    setProject(await getProject(project.id));
    refreshTokens();
  }, [project.id, refreshTokens]);

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 5000);
  };

  // Tomas y assets en vuelo → mismo tracker Pusher/polling que usa el chat.
  const pending = useMemo(
    () => [
      ...shots.filter((s) => BUSY.includes(s.status) && s.generation_id).map((s) => ({ generation_id: s.generation_id, media_type: "video" })),
      ...(project.assets || []).filter((a) => a.status === "generating" && a.generation_id).map((a) => ({ generation_id: a.generation_id, media_type: "image" })),
    ],
    [shots, project.assets],
  );
  useGenerationTracker({ userId: chatData?.user_id, pending, onFinal: reload });

  const handleGenerate = async (shot) => {
    setGeneratingIds((s) => new Set(s).add(shot.id));
    try {
      await generateShot(project.id, shot.id);
      await reload();
    } catch (err) {
      notify(err.message);
    } finally {
      setGeneratingIds((s) => { const n = new Set(s); n.delete(shot.id); return n; });
    }
  };

  const [moving, setMoving] = useState(false);
  const handleMove = async (shot, dir) => {
    if (moving) return;
    const ids = shots.map((s) => s.id);
    const i = ids.indexOf(shot.id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    setMoving(true);
    try {
      const reordered = await reorderShots(project.id, ids);
      setProject((p) => ({ ...p, shots: reordered }));
    } catch (err) {
      notify(err.message);
    } finally {
      setMoving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteShot(project.id, toDelete.id);
      setToDelete(null);
      await reload();
    } catch (err) {
      notify(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const saveMeta = async (patch) => {
    try {
      const updated = await updateProject(project.id, patch);
      setProject((p) => ({ ...p, ...updated }));
    } catch (err) {
      notify(err.message);
    }
  };

  const handleImportVideo = async (asset) => {
    await importShot(project.id, asset.id);
    await reload();
  };
  const openEditVideo = (src) => {
    setAssetsOpen(false);
    setEditor({ shot: null, initial: { kind: "edit", source: { url: src.video_url, duration: src.duration } } });
  };
  // Toma de la que parte el editor: la ultima lista antes de la posicion (como hace el backend),
  // o la inmediata anterior si ninguna esta lista (para avisar que falta generarla).
  const prevShotFor = (shot, after) => {
    const end = after ? shots.findIndex((s) => s.id === after.id) + 1 : shot ? shots.findIndex((s) => s.id === shot.id) : shots.length;
    const before = shots.slice(0, end);
    return [...before].reverse().find((s) => s.status === "completed" && s.video_url) || before.at(-1) || null;
  };

  // "Continuar" crea al final y, si la toma origen no era la ultima, la reinserta justo despues.
  const handleSaved = async (saved) => {
    const after = editor?.after;
    setEditor(null);
    if (after && shots.at(-1)?.id !== after.id && saved?.id) {
      const ids = shots.map((s) => s.id).filter((id) => id !== saved.id);
      ids.splice(ids.indexOf(after.id) + 1, 0, saved.id);
      await reorderShots(project.id, ids).catch((err) => notify(err.message));
    }
    reload();
  };

  const completed = shots.filter((s) => s.status === "completed").length;
  const totalSeconds = shots.reduce((acc, s) => acc + (s.status === "completed" ? Number(s.duration || 0) : 0), 0);

  return (
    <div className="flex-1 flex min-h-0 overflow-hidden bg-primarioDark">
      <div className="hidden lg:flex"><AssetPanel project={project} onChange={reload} onImportVideo={handleImportVideo} onEditVideo={openEditVideo} /></div>
      {assetsOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <AssetPanel project={project} onChange={reload} onImportVideo={handleImportVideo} onEditVideo={openEditVideo} onClose={() => setAssetsOpen(false)} />
          <div className="flex-1 bg-black/60" onClick={() => setAssetsOpen(false)} />
        </div>
      )}

      <div className="relative flex-1 flex flex-col min-w-0 min-h-0">
        {/* Header */}
        <div className="h-12 border-b border-gray-800 flex items-center gap-3 px-4 shrink-0">
          <Link to="/app/projects" className="text-gray-500 hover:text-white transition-colors" title={t("studio.title")}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <button onClick={() => setAssetsOpen(true)} className="lg:hidden text-gray-400 hover:text-white" title={t("studio.characters")}>
            <Users className="h-5 w-5" />
          </button>
          <input
            defaultValue={project.name}
            onBlur={(e) => e.target.value.trim() && e.target.value !== project.name && saveMeta({ name: e.target.value.trim() })}
            className="bg-transparent text-white font-semibold text-base focus:outline-none focus:border-b focus:border-[#DC569D] min-w-0 flex-1"
          />
          <div className="hidden md:flex items-center gap-4">
            <StatusDot status={completed === shots.length && shots.length > 0 ? "completed" : "draft"} label={`${completed}/${shots.length} ${t("studio.shots")}`} />
            <Mono>{totalSeconds}s · {project.aspect_ratio}</Mono>
          </div>
          <div className="flex items-center gap-1.5 bg-[#2f2f2f] px-2.5 py-1 rounded-lg" title="tokens">
            <CreditCard className="h-4 w-4 text-[#DC569D]" />
            <span className="text-white text-sm font-medium">{tokens === null ? "…" : Math.floor(tokens).toLocaleString("en-US")}</span>
          </div>
          <Link to="/buy-tokens" className="px-2.5 py-1.5 bg-[#DC569D] hover:bg-[#c9458b] text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            <span className="hidden lg:inline">{t("chat.buy-tokens")}</span>
          </Link>
          <button onClick={() => setBriefOpen((o) => !o)} className="flex items-center gap-1 text-gray-400 hover:text-white text-xs transition-colors">
            <Mono className="text-inherit">{t("studio.brief")}</Mono>
            {briefOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>

        {briefOpen && (
          <div className="border-b border-gray-800 p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#171717]/60 shrink-0">
            <div>
              <Mono>{t("studio.brief")}</Mono>
              <textarea rows={3} defaultValue={project.brief || ""} placeholder={t("studio.brief-hint")} onBlur={(e) => e.target.value !== (project.brief || "") && saveMeta({ brief: e.target.value })} className={`${INPUT} mt-1 resize-none`} />
            </div>
            <div>
              <Mono>{t("studio.style")}</Mono>
              <textarea rows={3} defaultValue={project.style || ""} placeholder={t("studio.style-hint")} onBlur={(e) => e.target.value !== (project.style || "") && saveMeta({ style: e.target.value })} className={`${INPUT} mt-1 resize-none`} />
            </div>
          </div>
        )}

        <ShotTimeline
          shots={shots}
          generatingIds={generatingIds}
          onAdd={() => setEditor({ shot: null })}
          onGenerate={handleGenerate}
          onContinue={(shot) => setEditor({ shot: null, after: shot })}
          onExtend={(shot) => setEditor({ shot: null, after: shot, initial: { chain_mode: "extend", model: "seedance-2.5" } })}
          onEditVideo={openEditVideo}
          onEdit={(shot) => setEditor({ shot })}
          onPreview={setPreview}
          onDelete={setToDelete}
          onMove={handleMove}
        />

        {toast && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#1a1a1a] border border-red-900/60 text-red-300 text-sm px-4 py-2 rounded-lg shadow-lg z-50">
            {toast}
          </div>
        )}
      </div>

      {chatData && !chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          title={t("studio.chat")}
          className="hidden md:flex w-12 shrink-0 border-l border-gray-800 flex-col items-center gap-3 pt-3 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <PanelRightOpen className="h-5 w-5" />
          <MessageSquare className="h-4 w-4 text-[#DC569D]" />
        </button>
      )}

      {/* ponytail: oculto con CSS en vez de desmontar, para no perder el estado del chat */}
      {chatData && (
        <div className={`${chatOpen ? "hidden md:flex" : "hidden"} w-[420px] shrink-0 border-l border-gray-800 flex-col min-h-0`}>
          <div className="h-12 border-b border-gray-800 flex items-center gap-2 px-4 shrink-0">
            <MessageSquare className="h-4 w-4 text-[#DC569D]" />
            <Mono className="text-gray-300">{t("studio.chat")}</Mono>
            <Mono className="ml-auto truncate">{t("studio.chat-hint")}</Mono>
            <button onClick={() => setChatOpen(false)} className="text-gray-400 hover:text-white transition-colors shrink-0" title={t("studio.chat")}>
              <PanelRightClose className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 flex flex-col min-h-0">
            <ChatView chatData={chatData} onGenerationFinal={reload} embedded />
          </div>
        </div>
      )}

      {editor && (
        <ShotEditorModal
          project={project}
          shot={editor.shot}
          prevShot={prevShotFor(editor.shot, editor.after)}
          seed={editor.after}
          initial={editor.initial}
          onClose={() => setEditor(null)}
          onSaved={handleSaved}
          onAssetsChanged={reload}
        />
      )}
      {preview && (
        <ModalPreview isOpen type="video" data={{ video_url: preview.video_url, name: preview.prompt }} onClose={() => setPreview(null)} />
      )}
      {toDelete && (
        <ConfirmDelete title={t("studio.delete-shot-title")} body={t("studio.delete-shot-confirm")} busy={deleting} onCancel={() => setToDelete(null)} onConfirm={confirmDelete} />
      )}
    </div>
  );
}
