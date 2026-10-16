import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "../i18n/i18n-context";
import { COUNTRIES } from "../lib/countries";

// Preguntas de calificación B2B del form de aplicación (después del paso de cuenta).
// Las opciones deben coincidir con OnboardingController::RULES en el backend.
const STEPS = [
  { fields: ["company", "website", "country", "phone"] },
  {
    fields: ["role", "decision_role"],
    options: {
      role: ["marketing", "agency", "founder", "creator", "production", "other"],
      decision_role: ["decision_maker", "recommender", "evaluator", "exploring"],
    },
  },
  {
    fields: ["company_size", "team_size", "industry"],
    options: {
      company_size: ["1-10", "11-50", "51-200", "201-1000", "1000+"],
      team_size: ["1", "2-10", "11-50", "51-200", "200+"],
      industry: ["ecommerce", "agency", "saas", "retail", "real_estate", "education", "health", "media", "other"],
    },
  },
  {
    fields: ["use_case", "monthly_volume", "current_solution"],
    options: {
      use_case: ["ads", "social", "product", "agency_clients", "personal"],
      monthly_volume: ["<5", "5-20", "20-100", "100+"],
      current_solution: ["in_house", "agency", "freelancers", "other_ai", "none"],
    },
  },
  {
    fields: ["budget", "timeline", "source"],
    options: {
      budget: ["0", "<100", "100-500", "500-2k", "2k+"],
      timeline: ["this_week", "this_month", "1-3_months", "exploring"],
      source: ["google", "social", "referral", "product_hunt", "other"],
    },
  },
];

export const TOTAL_STEPS = STEPS.length + 1; // + paso de cuenta

const INPUT_CLASS =
  "w-full bg-black/30 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-[#DC569D] transition-colors";

// Igual que la regla `regex` de OnboardingController.
const PHONE_RE = /^\+?[0-9\s\-().]{7,20}$/;

export function withScheme(url) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function isValidUrl(url) {
  try {
    return new URL(withScheme(url.trim())).hostname.includes(".");
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

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-gray-300 text-sm font-medium mb-2">{label}</label>
      {children}
    </div>
  );
}

/** Pasos 2..N del form. `answers` vive en el padre para no perderlo si hay que volver al paso de cuenta. */
function ApplicationSteps({ answers, setAnswers, onBack, onSubmit, isSubmitting, error }) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [localError, setLocalError] = useState("");

  const setField = (key, value) => setAnswers((a) => ({ ...a, [key]: value }));
  const current = STEPS[step];
  const isFirstStep = step === 0;
  const isLastStep = step === STEPS.length - 1;
  const isStepFilled = current.fields.every((k) => (answers[k] ?? "").trim() !== "");

  const handleNext = () => {
    setLocalError("");
    if (isFirstStep && !isValidUrl(answers.website)) return setLocalError(t("onboarding.err.url"));
    if (isFirstStep && !PHONE_RE.test(answers.phone.trim())) return setLocalError(t("onboarding.err.phone"));
    if (isLastStep) return onSubmit();
    setStep((s) => s + 1);
  };

  return (
    <div className="space-y-5">
      <StepProgress current={step + 2} t={t} />

      {isFirstStep ? (
        <>
          <Field label={t("onboarding.company")}>
            <input className={INPUT_CLASS} placeholder={t("onboarding.company.ph")} value={answers.company || ""}
              onChange={(e) => setField("company", e.target.value)} maxLength={120} />
          </Field>
          <Field label={t("onboarding.website")}>
            <input className={INPUT_CLASS} placeholder={t("onboarding.website.ph")} value={answers.website || ""}
              onChange={(e) => setField("website", e.target.value)} maxLength={255} />
          </Field>
          <Field label={t("onboarding.country")}>
            <select className={INPUT_CLASS} value={answers.country || ""} onChange={(e) => setField("country", e.target.value)}>
              <option value="" disabled>{t("onboarding.country.ph")}</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
              ))}
            </select>
          </Field>
          <Field label={t("onboarding.phone")}>
            <input type="tel" autoComplete="tel" className={INPUT_CLASS} placeholder={t("onboarding.phone.ph")}
              value={answers.phone || ""} onChange={(e) => setField("phone", e.target.value)} maxLength={20} />
          </Field>
        </>
      ) : (
        current.fields.map((key) => (
          <Field key={key} label={t(`onboarding.${key}`)}>
            <div className="flex flex-wrap gap-2">
              {current.options[key].map((opt) => (
                <Chip key={opt} selected={answers[key] === opt} onClick={() => setField(key, opt)}>
                  {t(`onboarding.${key}.${opt}`)}
                </Chip>
              ))}
            </div>
          </Field>
        ))
      )}

      {isLastStep && (
        <Field label={t("onboarding.needs")}>
          <textarea className={`${INPUT_CLASS} resize-none`} rows={3} placeholder={t("onboarding.needs.ph")}
            value={answers.needs || ""} onChange={(e) => setField("needs", e.target.value)} maxLength={1000} />
        </Field>
      )}

      {(localError || error) && <p className="text-red-400 text-sm">{localError || error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => (isFirstStep ? onBack() : setStep((s) => s - 1))}
          disabled={isSubmitting}
          className="text-gray-400 hover:text-white px-4 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          {t("onboarding.back")}
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!isStepFilled || isSubmitting}
          className="flex-1 bg-[#DC569D] text-white py-3.5 rounded-xl font-bold hover:bg-[#c9458b] transition-all shadow-lg shadow-[#DC569D]/10 disabled:opacity-40 disabled:cursor-not-allowed flex justify-center items-center"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : isLastStep ? (
            t("auth.register.button")
          ) : (
            t("onboarding.next")
          )}
        </button>
      </div>
    </div>
  );
}

export function StepProgress({ current, t }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <div key={i} className={`h-1.5 flex-1 rounded-full ${i < current ? "bg-[#DC569D]" : "bg-gray-700"}`} />
      ))}
      <span className="text-gray-500 text-xs ml-2 whitespace-nowrap">
        {t("onboarding.step")} {current} {t("onboarding.of")} {TOTAL_STEPS}
      </span>
    </div>
  );
}

export default ApplicationSteps;
