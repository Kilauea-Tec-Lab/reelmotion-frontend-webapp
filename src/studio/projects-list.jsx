import { useState } from "react";
import { Link, useLoaderData, useNavigate } from "react-router-dom";
import { Film, Plus, Search, Trash2, Loader2 } from "lucide-react";
import { useI18n } from "../i18n/i18n-context";
import { createProject, deleteProject, listProjects } from "./functions";
import { ConfirmDelete, Modal, Mono, StatusDot } from "./components/ui";
import { BTN_PRIMARY, BTN_SECONDARY, CARD, INPUT } from "./components/tokens";

const ASPECTS = ["16:9", "9:16", "1:1", "4:3", "21:9"];

function ProjectCard({ project, onDelete }) {
  const { t } = useI18n();
  return (
    <Link to={`/app/projects/${project.id}`} className={`${CARD} group block overflow-hidden`}>
      <div className="aspect-video bg-[#0C0C0D] relative">
        {project.cover_url ? (
          <video src={project.cover_url} preload="metadata" muted className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film className="h-8 w-8 text-gray-700" />
          </div>
        )}
        <button
          onClick={(e) => { e.preventDefault(); onDelete(project); }}
          className="absolute top-2 right-2 bg-[#DC569D]/90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
          title={t("studio.delete")}
        >
          <Trash2 className="h-3.5 w-3.5 text-white" />
        </button>
      </div>
      <div className="p-3">
        <h3 className="text-white text-sm font-semibold truncate">{project.name}</h3>
        <div className="mt-1.5 flex items-center justify-between">
          <StatusDot
            status={project.shots_count > 0 ? "completed" : "draft"}
            label={`${project.shots_count} ${t("studio.shots")} · ${project.aspect_ratio}`}
          />
          <Mono>{new Date(project.updated_at).toLocaleDateString()}</Mono>
        </div>
      </div>
    </Link>
  );
}

function CreateProjectModal({ onClose, onCreated }) {
  const { t } = useI18n();
  const [form, setForm] = useState({ name: "", brief: "", style: "", aspect_ratio: "16:9" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onCreated(await createProject(form));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal onClose={() => !busy && onClose()} wide>
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#DC569D]/20"><Film className="text-[#DC569D]" size={20} /></div>
          <h3 className="text-xl font-semibold text-white">{t("studio.new")}</h3>
        </div>
        <div>
          <Mono>{t("studio.name")}</Mono>
          <input autoFocus required value={form.name} onChange={set("name")} className={`${INPUT} mt-1`} />
        </div>
        <div>
          <Mono>{t("studio.brief")}</Mono>
          <textarea rows={3} value={form.brief} onChange={set("brief")} placeholder={t("studio.brief-hint")} className={`${INPUT} mt-1 resize-none`} />
        </div>
        <div>
          <Mono>{t("studio.style")}</Mono>
          <textarea rows={2} value={form.style} onChange={set("style")} placeholder={t("studio.style-hint")} className={`${INPUT} mt-1 resize-none`} />
        </div>
        <div>
          <Mono>{t("studio.aspect")}</Mono>
          <div className="mt-1 flex gap-2">
            {ASPECTS.map((a) => (
              <button
                type="button"
                key={a}
                onClick={() => setForm((f) => ({ ...f, aspect_ratio: a }))}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-colors ${form.aspect_ratio === a ? "bg-[#DC569D] text-white" : "bg-[#2f2f2f] text-gray-400 hover:bg-[#3a3a3a] hover:text-white"}`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} disabled={busy} className={BTN_SECONDARY}>{t("studio.cancel")}</button>
          <button type="submit" disabled={busy || !form.name.trim()} className={BTN_PRIMARY}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {t("studio.create")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function ProjectsList() {
  const { t } = useI18n();
  const initial = useLoaderData();
  const navigate = useNavigate();
  const [projects, setProjects] = useState(initial || []);
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const search = async (value) => {
    setQ(value);
    setProjects(await listProjects(value));
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteProject(toDelete.id);
      setProjects((p) => p.filter((x) => x.id !== toDelete.id));
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-primarioDark">
      <div className="min-h-14 md:h-16 border-b border-gray-800 flex items-center justify-between px-4 md:px-6 py-3 md:py-0 shrink-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Film className="h-6 w-6 text-[#DC569D] flex-shrink-0" />
          <h2 className="text-lg md:text-xl font-semibold text-white">{t("studio.title")}</h2>
          <Mono className="hidden sm:inline">{projects.length} {t("studio.projects")}</Mono>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              value={q}
              onChange={(e) => search(e.target.value)}
              placeholder={t("studio.search")}
              className={`${INPUT} pl-9 w-56`}
            />
          </div>
          <button onClick={() => setCreating(true)} className={BTN_PRIMARY}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t("studio.new")}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {projects.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-3">
            <Film className="h-16 w-16 text-gray-700" />
            <p className="text-gray-400 max-w-sm">{t("studio.empty")}</p>
            <button onClick={() => setCreating(true)} className={BTN_PRIMARY}>
              <Plus className="h-4 w-4" />{t("studio.new")}
            </button>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {projects.map((p) => <ProjectCard key={p.id} project={p} onDelete={setToDelete} />)}
          </div>
        )}
      </div>

      {creating && (
        <CreateProjectModal
          onClose={() => setCreating(false)}
          onCreated={(p) => navigate(`/app/projects/${p.id}`)}
        />
      )}
      {toDelete && (
        <ConfirmDelete
          title={t("studio.delete-title")}
          body={t("studio.delete-confirm")}
          busy={deleting}
          onCancel={() => setToDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
