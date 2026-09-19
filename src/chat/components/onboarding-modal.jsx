import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { Sparkles, Zap, ArrowLeft } from "lucide-react";
import { useI18n } from "../../i18n/i18n-context";
import { COUNTRIES } from "../../lib/countries";

// Cuestionario B2B bloqueante: sin X, sin skip, sin cerrar al click fuera.
// Las opciones deben coincidir con las reglas `in:` de OnboardingController.
const STEPS = [
  { fields: ["company", "website", "country"] },
  {
    fields: ["role", "team_size"],
    options: {
      role: ["marketing", "agency", "founder", "creator", "production", "other"],
      team_size: ["1", "2-10", "11-50", "51-200", "200+"],
    },
  },
  {
    fields: ["use_case", "monthly_volume"],
    options: {
      use_case: ["ads", "social", "product", "agency_clients", "personal"],
      monthly_volume: ["<5", "5-20", "20-100", "100+"],
    },
  },
  {
    fields: ["budget", "source"],
    options: {
      budget: ["0", "<100", "100-500", "500-2k", "2k+"],
      source: ["google", "social", "referral", "product_hunt", "other"],
    },
  },
];

const INPUT_CLASS =
  "w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#DC569D] transition-colors";

function withScheme(url) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function isValidUrl(url) {
  try {
    const parsed = new URL(withScheme(url.trim()));
    return parsed.hostname.includes(".");
  } catch {
    return false;
  }
}

function Chip({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
        selected
          ? "bg-[#DC569D] border-[#DC569D] text-white"
          : "bg-black/40 border-gray-700 text-gray-300 hover:border-gray-500"
      }`}
    >
      {children}
    </button>
  );
}

function OnboardingModal({ onCompleted }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null); // { tokens_granted }

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const current = STEPS[step];
  const isFirstStep = step === 0;
  const isLastStep = step === STEPS.length - 1;
  const isStepFilled = current.fields.every((k) => (form[k] ?? "").trim() !== "");

  const handleNext = () => {
    setError("");
    if (isFirstStep && !isValidUrl(form.website)) {
      setError(t("onboarding.err.url"));
      return;
    }
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${import.meta.env.VITE_APP_BACKEND_URL}users/onboarding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + Cookies.get("token"),
        },
        body: JSON.stringify({ ...form, website: withScheme(form.website.trim()) }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || t("onboarding.err.generic"));

      const granted = json.data?.tokens_granted ?? 0;
      if (window.gtag) window.gtag("event", "onboarding_completed", { tokens_granted: granted });
      setResult({ tokens_granted: granted });
    } catch (err) {
      setError(err.message || t("onboarding.err.generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const finish = (to) => {
    onCompleted();
    if (to) navigate(to);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#161619] border border-gray-700 rounded-3xl w-full max-w-lg p-8 relative shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {result ? (
          <DoneScreen t={t} granted={result.tokens_granted} finish={finish} />
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-[#DC569D] to-[#F2D543] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles size={28} className="text-white" />
              </div>
              <h2 className="text-white text-2xl font-bold">{t("onboarding.title")}</h2>
              <p className="text-gray-400 text-sm mt-2">{t("onboarding.subtitle")}</p>
            </div>

            <div className="flex items-center gap-2 mb-6">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-[#DC569D]" : "bg-gray-700"}`}
                />
              ))}
              <span className="text-gray-500 text-xs ml-2 whitespace-nowrap">
                {t("onboarding.step")} {step + 1} {t("onboarding.of")} {STEPS.length}
              </span>
            </div>

            <div className="space-y-5">
              {isFirstStep ? (
                <>
                  <Field label={t("onboarding.company")}>
                    <input
                      className={INPUT_CLASS}
                      placeholder={t("onboarding.company.ph")}
                      value={form.company || ""}
                      onChange={(e) => setField("company", e.target.value)}
                      maxLength={120}
                    />
                  </Field>
                  <Field label={t("onboarding.website")}>
                    <input
                      className={INPUT_CLASS}
                      placeholder={t("onboarding.website.ph")}
                      value={form.website || ""}
                      onChange={(e) => setField("website", e.target.value)}
                      maxLength={255}
                    />
                  </Field>
                  <Field label={t("onboarding.country")}>
                    <select
                      className={INPUT_CLASS}
                      value={form.country || ""}
                      onChange={(e) => setField("country", e.target.value)}
                    >
                      <option value="" disabled>
                        {t("onboarding.country.ph")}
                      </option>
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </>
              ) : (
                current.fields.map((key) => (
                  <Field key={key} label={t(`onboarding.${key}`)}>
                    <div className="flex flex-wrap gap-2">
                      {current.options[key].map((opt) => (
                        <Chip key={opt} selected={form[key] === opt} onClick={() => setField(key, opt)}>
                          {t(`onboarding.${key}.${opt}`)}
                        </Chip>
                      ))}
                    </div>
                  </Field>
                ))
              )}
            </div>

            {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

            <div className="flex items-center gap-3 mt-8">
              {!isFirstStep && (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  disabled={isSubmitting}
                  className="text-gray-400 hover:text-white px-4 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                  <ArrowLeft size={18} />
                  {t("onboarding.back")}
                </button>
              )}
              <button
                type="button"
                onClick={isLastStep ? handleSubmit : handleNext}
                disabled={!isStepFilled || isSubmitting}
                className="flex-1 bg-gradient-to-r from-[#DC569D] to-[#c9458b] text-white py-3.5 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-[#DC569D]/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? t("onboarding.submitting")
                  : isLastStep
                    ? t("onboarding.submit")
                    : t("onboarding.next")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-gray-300 text-sm font-medium mb-2">{label}</label>
      {children}
    </div>
  );
}

function DoneScreen({ t, granted, finish }) {
  const hasTokens = granted > 0;
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-[#DC569D] to-[#F2D543] rounded-2xl flex items-center justify-center mx-auto mb-4">
        {hasTokens ? <Sparkles size={32} className="text-white" /> : <Zap size={32} className="text-white" />}
      </div>
      <h2 className="text-white text-2xl font-bold">
        {t(hasTokens ? "onboarding.done.granted.title" : "onboarding.done.title")}
      </h2>
      <p className="text-gray-400 text-sm mt-3 mb-8">
        {t(hasTokens ? "onboarding.done.granted.body" : "onboarding.done.body")}
      </p>
      {hasTokens ? (
        <button
          type="button"
          onClick={() => finish()}
          className="w-full bg-gradient-to-r from-[#DC569D] to-[#c9458b] text-white py-3.5 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-[#DC569D]/20"
        >
          {t("onboarding.done.granted.cta")}
        </button>
      ) : (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => finish("/buy-tokens")}
            className="w-full bg-[#F2D543] text-[#161619] py-3.5 rounded-xl font-bold hover:bg-[#f2f243] transition-all flex items-center justify-center gap-2"
          >
            <Zap size={18} />
            {t("onboarding.done.buy")}
          </button>
          <button
            type="button"
            onClick={() => finish()}
            className="w-full text-gray-400 hover:text-white py-2.5 rounded-xl font-medium transition-colors text-sm"
          >
            {t("onboarding.done.explore")}
          </button>
        </div>
      )}
    </div>
  );
}

export default OnboardingModal;
