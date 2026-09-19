import { useCallback, useMemo, useState } from "react";
import { Link, useLoaderData } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronUp, MessageSquare, PanelRightClose, PanelRightOpen } from "lucide-react";
import { useI18n } from "../i18n/i18n-context";
import ChatView from "../chat/chat-view";
import ModalPreview from "../components/modal-preview";
import { useGenerationTracker } from "../chat/use-generation-tracker";
import { deleteShot, generateShot, getProject, reorderShots, updateProject } from "./functions";
import AssetPanel from "./components/asset-panel";
import ShotTimeline from "./components/shot-timeline";
import ShotEditorModal from "./components/shot-editor-modal";
import { ConfirmDelete, Mono, StatusDot } from "./components/ui";
import { INPUT } from "./components/tokens";

const BUSY = ["queued", "processing", "generating"];

export default function ProjectWorkspace() {
  const { t } = useI18n();
  const { project: initial, chatData } = useLoaderData();
  const [project, setProject] = useState(initial);
  const [chatOpen, setChatOpen] = useState(true);
  const [briefOpen, setBriefOpen] = useState(false);
  const [editor, setEditor] = useState(null); // { shot: null | shot }
  const [preview, setPreview] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [generatingIds, setGeneratingIds] = useState(new Set());
  const [toast, setToast] = useState(null);

  const shots = useMemo(() => project.shots || [], [project.shots]);

  const reload = useCallback(async () => {
    setProject(await getProject(project.id));
  }, [project.id]);

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

  const handleMove = async (shot, dir) => {
    const ids = shots.map((s) => s.id);
    const i = ids.indexOf(shot.id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    const reordered = await reorderShots(project.id, ids);
    setProject((p) => ({ ...p, shots: reordered }));
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteShot(project.id, toDelete.id);
      setToDelete(null);
      await reload();
    } finally {
      setDeleting(false);
    }
  };

  const saveMeta = async (patch) => {
    const updated = await updateProject(project.id, patch);
    setProject((p) => ({ ...p, ...updated }));
  };

  const completed = shots.filter((s) => s.status === "completed").length;
  const totalSeconds = shots.reduce((acc, s) => acc + (s.status === "completed" ? Number(s.duration || 0) : 0), 0);

  return (
    <div className="flex-1 flex min-h-0 overflow-hidden bg-primarioDark">
      <div className="hidden lg:flex"><AssetPanel project={project} onChange={reload} /></div>

      <div className="relative flex-1 flex flex-col min-w-0 min-h-0">
        {/* Header */}
        <div className="h-12 border-b border-gray-800 flex items-center gap-3 px-4 shrink-0">
          <Link to="/app/projects" className="text-gray-500 hover:text-white transition-colors" title={t("studio.title")}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <input
            defaultValue={project.name}
            onBlur={(e) => e.target.value.trim() && e.target.value !== project.name && saveMeta({ name: e.target.value.trim() })}
            className="bg-transparent text-white font-semibold text-base focus:outline-none focus:border-b focus:border-[#DC569D] min-w-0 flex-1"
          />
          <div className="hidden md:flex items-center gap-4">
            <StatusDot status={completed === shots.length && shots.length > 0 ? "completed" : "draft"} label={`${completed}/${shots.length} ${t("studio.shots")}`} />
            <Mono>{totalSeconds}s · {project.aspect_ratio}</Mono>
          </div>
          <button onClick={() => setBriefOpen((o) => !o)} className="flex items-center gap-1 text-gray-400 hover:text-white text-xs transition-colors">
            <Mono className="text-inherit">{t("studio.brief")}</Mono>
            {briefOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <button onClick={() => setChatOpen((o) => !o)} className="text-gray-400 hover:text-white transition-colors" title={t("studio.chat")}>
            {chatOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
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

      {chatOpen && chatData && (
        <div className="hidden md:flex w-[420px] shrink-0 border-l border-gray-800 flex-col min-h-0">
          <div className="h-12 border-b border-gray-800 flex items-center gap-2 px-4 shrink-0">
            <MessageSquare className="h-4 w-4 text-[#DC569D]" />
            <Mono className="text-gray-300">{t("studio.chat")}</Mono>
            <Mono className="ml-auto">{t("studio.chat-hint")}</Mono>
          </div>
          <div className="flex-1 flex flex-col min-h-0">
            <ChatView chatData={chatData} onGenerationFinal={reload} />
          </div>
        </div>
      )}

      {editor && (
        <ShotEditorModal
          project={project}
          shot={editor.shot}
          isFirst={editor.shot ? shots[0]?.id === editor.shot.id : shots.length === 0}
          onClose={() => setEditor(null)}
          onSaved={() => { setEditor(null); reload(); }}
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
