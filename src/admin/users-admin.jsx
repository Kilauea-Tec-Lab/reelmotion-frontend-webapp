import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLoaderData, useNavigation, useRevalidator, useSearchParams } from "react-router-dom";
import { ArrowDown, ArrowUp, Check, ChevronLeft, ChevronRight, Eye, Loader2, Search, Trash2, UserX } from "lucide-react";
import { useI18n } from "../i18n/i18n-context";
import { approveUser, deleteUser, fmtDate, fmtNum, rejectUser } from "./functions";

export function Avatar({ user, size = "h-8 w-8" }) {
  return user.image ? (
    <img src={user.image} alt="" className={`${size} rounded-full object-cover shrink-0`} />
  ) : (
    <div className={`${size} rounded-full bg-[#DC569D]/20 text-[#DC569D] flex items-center justify-center text-sm font-semibold shrink-0`}>
      {(user.name || user.email || "?")[0].toUpperCase()}
    </div>
  );
}

/** Aprobar un lead pendiente (le llegan el welcome y los tokens). Sin confirmación: no es destructivo. */
export function ApproveButton({ user, onDone, className = "", children }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const approve = async () => {
    setBusy(true);
    setError("");
    try {
      await approveUser(user.id);
      onDone();
    } catch (e) {
      setError(e?.message || t("admin.users.approve-error"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      onClick={approve}
      disabled={busy}
      title={error || t("admin.users.approve")}
      className={`inline-flex items-center gap-2 hover:bg-green-500/10 disabled:opacity-50 ${error ? "text-red-400" : "text-green-400"} ${className}`}
    >
      {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
      {children}
      {error && <span className="text-xs">{error}</span>}
    </button>
  );
}

const MODAL_MODES = {
  delete: { action: deleteUser, Icon: Trash2, title: "admin.users.delete-title", confirm: "admin.users.delete-confirm", cta: "sidebar.delete", busy: "sidebar.deleting" },
  reject: { action: rejectUser, Icon: UserX, title: "admin.users.reject-title", confirm: "admin.users.reject-confirm", cta: "admin.users.reject", busy: "sidebar.deleting" },
};

/** Confirmación de borrado/rechazo; mismo patrón que el modal de borrar chat del sidebar. */
export function DeleteUserModal({ user, onClose, onDeleted, mode = "delete" }) {
  const m = MODAL_MODES[mode];
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const confirm = async () => {
    setBusy(true);
    setError("");
    try {
      await m.action(user.id);
      onDeleted();
    } catch (e) {
      setError(e?.message || t("admin.users.delete-error"));
      setBusy(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] flex items-center justify-center p-4" onClick={busy ? undefined : onClose}>
      <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-[#DC569D]/20 rounded-full p-3">
            <m.Icon className="h-6 w-6 text-[#DC569D]" />
          </div>
          <h3 className="text-xl font-semibold text-white">{t(m.title)}</h3>
        </div>
        <p className="text-gray-400 mb-2">{t(m.confirm)}</p>
        <p className="text-white font-mono text-sm mb-6 break-all">{user.email}</p>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} disabled={busy} className="px-4 py-2 bg-[#2f2f2f] text-gray-300 rounded-lg hover:bg-[#3a3a3a] transition-colors disabled:opacity-50">
            {t("sidebar.cancel")}
          </button>
          <button onClick={confirm} disabled={busy} className="px-4 py-2 bg-[#DC569D] text-white rounded-lg hover:bg-[#c44a87] transition-colors disabled:opacity-50 flex items-center gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <m.Icon className="h-4 w-4" />}
            {busy ? t(m.busy) : t(m.cta)}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

const SEARCH_DEBOUNCE_MS = 300;

export default function UsersAdmin() {
  const { data: users, meta } = useLoaderData();
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const [q, setQ] = useState(params.get("q") || "");
  const [toDelete, setToDelete] = useState(null); // { user, mode }

  // Cambia params conservando los demás; cualquier filtro nuevo vuelve a la página 1.
  const update = (patch) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries({ page: "", ...patch }).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
      return next;
    }, { replace: true });

  useEffect(() => {
    if (q === (params.get("q") || "")) return;
    const id = setTimeout(() => update({ q }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const sort = params.get("sort") || "created_at";
  const dir = params.get("dir") || "desc";
  const sortBy = (key) => update({ sort: key, dir: sort === key && dir === "desc" ? "asc" : "desc" });

  const SortTh = ({ k, children }) => (
    <th className="px-3 py-2 font-medium whitespace-nowrap">
      <button onClick={() => sortBy(k)} className="inline-flex items-center gap-1 hover:text-white">
        {children}
        {sort === k && (dir === "desc" ? <ArrowDown size={14} /> : <ArrowUp size={14} />)}
      </button>
    </th>
  );

  const loading = navigation.state === "loading" && navigation.location?.pathname === "/app/users";

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold">{t("admin.users.title")}</h1>
            <p className="text-gray-400 text-sm mt-1">
              {t("admin.users.total", { total: fmtNum(meta.total) })}
              {meta.pending_count > 0 && (
                <button onClick={() => update({ onboarding: "pending_approval" })} className="ml-3 text-[#F2D543] hover:underline">
                  {t("admin.users.pending-count", { count: meta.pending_count })}
                </button>
              )}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("admin.users.search")}
                className="w-full sm:w-72 bg-[#2f2f2f] border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#DC569D]"
              />
            </label>
            <select
              value={params.get("onboarding") || ""}
              onChange={(e) => update({ onboarding: e.target.value })}
              aria-label={t("admin.users.onboarding")}
              className="bg-[#2f2f2f] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#DC569D]"
            >
              <option value="">{t("admin.users.filter.all")}</option>
              <option value="completed">{t("admin.users.filter.completed")}</option>
              <option value="pending">{t("admin.users.filter.pending")}</option>
              <option value="pending_approval">{t("admin.users.pending-approval")}</option>
            </select>
          </div>
        </div>

        <div className={`overflow-x-auto rounded-xl border border-white/5 transition-opacity ${loading ? "opacity-50" : ""}`}>
          <table className="w-full text-sm text-left">
            <thead className="bg-white/5 text-gray-300">
              <tr>
                <th className="px-3 py-2 font-medium">{t("admin.users.user")}</th>
                <SortTh k="created_at">{t("admin.users.registered")}</SortTh>
                <SortTh k="balance">{t("admin.users.balance")}</SortTh>
                <SortTh k="generations">{t("admin.users.generations")}</SortTh>
                <SortTh k="lead_score">{t("admin.users.lead-score")}</SortTh>
                <th className="px-3 py-2 font-medium">{t("admin.users.onboarding")}</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02]">
                  <td className="px-3 py-2">
                    <Link to={`/app/users/${u.id}`} className="flex items-center gap-3 min-w-0">
                      <Avatar user={u} />
                      <div className="min-w-0">
                        <div className="text-white truncate">{[u.name, u.last_name].filter(Boolean).join(" ") || u.username}</div>
                        <div className="text-gray-400 text-xs truncate">{u.email}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{fmtDate(u.created_at)}</td>
                  <td className="px-3 py-2 font-mono text-xs text-[#F2D543] whitespace-nowrap">{fmtNum(u.balance)}</td>
                  <td className="px-3 py-2 text-gray-300">{fmtNum(u.generations_count)}</td>
                  <td className="px-3 py-2 text-gray-300">{u.lead_score ?? "—"}</td>
                  <td className="px-3 py-2">
                    {u.approval_status === "pending" ? (
                      <span className="px-2 py-0.5 rounded-full text-xs whitespace-nowrap bg-[#F2D543]/15 text-[#F2D543]">
                        {t("admin.users.pending-approval")}
                      </span>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full text-xs whitespace-nowrap ${u.onboarding_completed ? "bg-green-500/15 text-green-400" : "bg-white/5 text-gray-400"}`}>
                        {u.onboarding_completed ? t("admin.users.filter.completed") : t("admin.users.filter.pending")}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      {u.approval_status === "pending" && (
                        <>
                          <ApproveButton user={u} onDone={revalidator.revalidate} className="p-2 rounded-lg" />
                          <button onClick={() => setToDelete({ user: u, mode: "reject" })} title={t("admin.users.reject")} className="p-2 rounded-lg text-gray-400 hover:text-[#DC569D] hover:bg-white/5">
                            <UserX size={16} />
                          </button>
                        </>
                      )}
                      <Link to={`/app/users/${u.id}`} title={t("admin.users.view")} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5">
                        <Eye size={16} />
                      </Link>
                      <button onClick={() => setToDelete({ user: u, mode: "delete" })} title={t("sidebar.delete")} className="p-2 rounded-lg text-gray-400 hover:text-[#DC569D] hover:bg-white/5">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-gray-500">{t("admin.users.empty")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end gap-3 mt-4 text-sm text-gray-400">
          <span>{t("admin.users.page", { page: meta.page, last: meta.last_page })}</span>
          <button disabled={meta.page <= 1} onClick={() => update({ page: String(meta.page - 1) })} className="p-2 rounded-lg bg-[#2f2f2f] disabled:opacity-40 hover:bg-[#3a3a3a]">
            <ChevronLeft size={16} />
          </button>
          <button disabled={meta.page >= meta.last_page} onClick={() => update({ page: String(meta.page + 1) })} className="p-2 rounded-lg bg-[#2f2f2f] disabled:opacity-40 hover:bg-[#3a3a3a]">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {toDelete && (
        <DeleteUserModal
          user={toDelete.user}
          mode={toDelete.mode}
          onClose={() => setToDelete(null)}
          onDeleted={() => {
            setToDelete(null);
            revalidator.revalidate();
          }}
        />
      )}
    </div>
  );
}
