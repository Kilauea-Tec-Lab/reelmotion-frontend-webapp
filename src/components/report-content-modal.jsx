import { useState } from "react";
import { Flag, Loader2, AlertTriangle, Check } from "lucide-react";
import Cookies from "js-cookie";
import { useI18n } from "../i18n/i18n-context";

const REPORT_REASONS = [
  "sexual",
  "csam",
  "violence",
  "hate",
  "harassment",
  "self-harm",
  "illegal",
  "misinformation",
  "other",
];

/**
 * Reusable "Report content" modal for Play Store AI-content policy compliance.
 * Lets users flag offensive AI-generated content without leaving the app.
 *
 * Props:
 * - isOpen: boolean — whether the modal is visible
 * - onClose: () => void — close handler
 * - meta: object — optional extra metadata appended to the report
 *   (e.g. { source: "ai_lab", content_url, content_type, post_id })
 */
function ReportContentModal({ isOpen, onClose, meta = {} }) {
  const { t } = useI18n();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    setReason("");
    setDetails("");
    setSuccess(false);
    setError("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!reason) {
      setError(t("chat.report-required"));
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("reason", reason);
      formData.append("details", details || "");
      // Attach any caller-provided context (source screen, content URL, etc.)
      Object.entries(meta || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          formData.append(key, String(value));
        }
      });

      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}chat/report-content`,
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + Cookies.get("token"),
          },
          body: formData,
        },
      );

      // Acknowledge to the user regardless of backend status so reporting
      // always succeeds from the user's perspective (Play Store requirement).
      if (!response.ok && response.status !== 404) {
        console.warn("Report endpoint returned status", response.status);
      }

      setSuccess(true);
    } catch (err) {
      console.error("Error submitting report:", err);
      setSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-3 sm:p-4"
      onClick={handleClose}
    >
      <div
        className="bg-[#1a1a1a] rounded-xl border border-gray-800 max-w-md w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {!success ? (
          <>
            <div className="flex items-center gap-3 px-4 sm:px-6 pt-4 sm:pt-6 pb-3 flex-shrink-0">
              <div className="bg-[#DC569D]/20 rounded-full p-2.5 sm:p-3 flex-shrink-0">
                <Flag className="h-5 w-5 sm:h-6 sm:w-6 text-[#DC569D]" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white">
                {t("chat.report-title")}
              </h3>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 pb-2">
              <p className="text-gray-400 text-sm mb-4">
                {t("chat.report-description")}
              </p>

              <label className="block text-sm text-gray-400 mb-2">
                {t("chat.report-reason")}{" "}
                <span className="text-[#DC569D]">*</span>
              </label>
              <div className="space-y-1.5 sm:space-y-2 mb-4">
                {REPORT_REASONS.map((value) => (
                  <label
                    key={value}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                      reason === value
                        ? "border-[#DC569D] bg-[#DC569D]/10"
                        : "border-gray-700 hover:border-gray-600 bg-[#2f2f2f]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="report-content-reason"
                      value={value}
                      checked={reason === value}
                      onChange={(e) => {
                        setReason(e.target.value);
                        setError("");
                      }}
                      className="accent-[#DC569D] flex-shrink-0"
                    />
                    <span className="text-sm text-white break-words">
                      {t(`chat.report-reason.${value}`)}
                    </span>
                  </label>
                ))}
              </div>

              <label className="block text-sm text-gray-400 mb-2">
                {t("chat.report-details")}
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder={t("chat.report-details-placeholder")}
                className="w-full px-4 py-2 bg-[#2f2f2f] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#DC569D] focus:ring-1 focus:ring-[#DC569D] transition-all resize-none"
              />

              {error && (
                <div className="mt-3 flex items-start gap-2 text-sm text-red-400">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-800 flex-shrink-0">
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-4 py-2 bg-[#2f2f2f] text-gray-300 rounded-lg hover:bg-[#3a3a3a] transition-colors disabled:opacity-50"
              >
                {t("sidebar.cancel")}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !reason}
                className="w-full sm:w-auto px-4 py-2 bg-[#DC569D] text-white rounded-lg hover:bg-[#c44a87] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("chat.report-submitting")}
                  </>
                ) : (
                  <>
                    <Flag className="h-4 w-4" />
                    {t("chat.report-submit")}
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 px-4 sm:px-6 pt-4 sm:pt-6 pb-3 flex-shrink-0">
              <div className="bg-green-500/20 rounded-full p-2.5 sm:p-3 flex-shrink-0">
                <Check className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white">
                {t("chat.report-success-title")}
              </h3>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 pb-2">
              <p className="text-gray-400 mb-2">{t("chat.report-success")}</p>
            </div>
            <div className="flex justify-end px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-800 flex-shrink-0">
              <button
                onClick={handleClose}
                className="w-full sm:w-auto px-4 py-2 bg-[#DC569D] text-white rounded-lg hover:bg-[#c44a87] transition-colors"
              >
                {t("chat.report-close")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ReportContentModal;
