import { createPortal } from "react-dom";
import { Loader2, Trash2 } from "lucide-react";
import { useI18n } from "../../i18n/i18n-context";
import { BTN_PRIMARY, BTN_SECONDARY, STATUS_DOT } from "./tokens";

export function Mono({ children, className = "" }) {
  return (
    <span className={`font-mono text-[10px] uppercase tracking-wider text-gray-500 ${className}`}>
      {children}
    </span>
  );
}

export function StatusDot({ status, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status] || "bg-gray-500"}`} />
      {label !== undefined && <Mono>{label}</Mono>}
    </span>
  );
}

/** Modal base: overlay + card. Se portalea al body como los modales del sidebar. */
export function Modal({ onClose, children, wide = false }) {
  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDelete({ title, body, busy, onCancel, onConfirm }) {
  const { t } = useI18n();
  return (
    <Modal onClose={() => !busy && onCancel()}>
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-[#DC569D]/20 rounded-full p-3">
          <Trash2 className="h-6 w-6 text-[#DC569D]" />
        </div>
        <h3 className="text-xl font-semibold text-white">{title}</h3>
      </div>
      <p className="text-gray-400 mb-6">{body}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} disabled={busy} className={BTN_SECONDARY}>
          {t("studio.cancel")}
        </button>
        <button onClick={onConfirm} disabled={busy} className={BTN_PRIMARY}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          {t("studio.delete")}
        </button>
      </div>
    </Modal>
  );
}
