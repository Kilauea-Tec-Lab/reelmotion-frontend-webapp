import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Cookies from "js-cookie";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { useI18n } from "../i18n/i18n-context";
import LanguageSelector from "../i18n/language-selector";
import AuthModal from "../auth/auth-modal";
import { approveAuthorization, getAuthorizeInfo } from "../profile/api-functions";

const strings = {
  en: {
    title: (name) => `${name} wants to access your Reelmotion account`,
    unverified: "This app was registered automatically and has not been reviewed by Reelmotion. Only continue if you started this from an app you trust.",
    will: "This will allow it to:",
    spend: "Generations created by this app spend your Reelmotion tokens.",
    allow: "Allow",
    deny: "Deny",
    loading: "Loading…",
    invalid: "This authorization request is invalid or has expired.",
    signin: "Sign in to continue",
  },
  es: {
    title: (name) => `${name} quiere acceder a tu cuenta de Reelmotion`,
    unverified: "Esta app se registró automáticamente y no ha sido revisada por Reelmotion. Continúa solo si iniciaste esto desde una app en la que confías.",
    will: "Esto le permitirá:",
    spend: "Las generaciones creadas por esta app gastan tus tokens de Reelmotion.",
    allow: "Permitir",
    deny: "Denegar",
    loading: "Cargando…",
    invalid: "Esta solicitud de autorización no es válida o expiró.",
    signin: "Inicia sesión para continuar",
  },
};

const PARAMS = ["response_type", "client_id", "redirect_uri", "scope", "state", "code_challenge", "code_challenge_method", "resource"];

export default function ConsentPage() {
  const { locale } = useI18n();
  const t = strings[locale] || strings.en;
  const [search] = useSearchParams();
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const loggedIn = Boolean(Cookies.get("token"));

  const params = Object.fromEntries(PARAMS.filter((k) => search.has(k)).map((k) => [k, search.get(k)]));

  useEffect(() => {
    if (!loggedIn) {
      sessionStorage.setItem("post_login_redirect", window.location.pathname + window.location.search);
      return;
    }
    getAuthorizeInfo(new URLSearchParams(params).toString())
      .then(setInfo)
      .catch(() => setError(t.invalid));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn, search.toString()]);

  const decide = async (approve) => {
    setBusy(true);
    try {
      const { redirect_to } = await approveAuthorization(params, approve);
      window.location.replace(redirect_to);
    } catch (e) {
      setError(e.message || t.invalid);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0C0C0D] text-white flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <img src="/logos/logo_reelmotion_new.webp" alt="Reelmotion AI" className="h-7" />
        <LanguageSelector />
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        {!loggedIn ? (
          <div className="text-center space-y-4">
            <p className="text-gray-400">{t.signin}</p>
            <AuthModal isOpen onClose={() => {}} />
          </div>
        ) : error ? (
          <div className="max-w-md w-full bg-darkBox rounded-2xl p-8 text-center space-y-3">
            <ShieldAlert className="mx-auto text-red-400" size={36} />
            <p className="text-gray-300">{error}</p>
          </div>
        ) : !info ? (
          <p className="text-gray-500">{t.loading}</p>
        ) : (
          <div className="max-w-md w-full bg-darkBox rounded-2xl p-8 space-y-6">
            <div className="flex items-center gap-4">
              {info.client.logo_uri ? (
                <img src={info.client.logo_uri} alt="" className="w-12 h-12 rounded-xl object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-darkBoxSub flex items-center justify-center">
                  <ShieldCheck className="text-[#DC569D]" size={24} />
                </div>
              )}
              <h1 className="text-lg montserrat-medium leading-snug">{t.title(info.client.name)}</h1>
            </div>

            {!info.client.verified && (
              <p className="text-xs text-yellow-300/90 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">{t.unverified}</p>
            )}

            <div>
              <p className="text-sm text-gray-400 mb-2">{t.will}</p>
              <ul className="space-y-2">
                {info.scopes.map((s) => (
                  <li key={s.id} className="flex items-start gap-2 text-sm text-gray-200">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#DC569D] shrink-0" />
                    {s.description}
                  </li>
                ))}
              </ul>
              {info.scopes.some((s) => s.id === "generate") && <p className="text-xs text-gray-500 mt-3">{t.spend}</p>}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => decide(false)}
                disabled={busy}
                className="flex-1 py-2.5 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 text-sm disabled:opacity-50"
              >
                {t.deny}
              </button>
              <button
                onClick={() => decide(true)}
                disabled={busy}
                className="flex-1 py-2.5 rounded-lg bg-[#DC569D] text-white montserrat-medium text-sm hover:bg-[#c94a8c] disabled:opacity-50"
              >
                {t.allow}
              </button>
            </div>
            {info.client.client_uri && (
              <p className="text-xs text-gray-600 text-center break-all">{info.client.client_uri}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
