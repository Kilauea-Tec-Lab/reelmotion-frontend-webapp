import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Copy, KeyRound, Plug, ShieldCheck, Trash2, RefreshCw, BookOpen, Check } from "lucide-react";
import { useI18n } from "../i18n/i18n-context";
import {
  SCOPES,
  createApiKey,
  createOAuthClient,
  deleteOAuthClient,
  listApiKeys,
  listAuthorizations,
  listOAuthClients,
  revokeApiKey,
  revokeAuthorization,
  rotateOAuthClientSecret,
} from "./api-functions";

const strings = {
  en: {
    title: "API & Integrations",
    subtitle: "Use your Reelmotion tokens from other platforms, scripts or AI assistants (Claude, ChatGPT, Cursor).",
    docs: "Developer docs",
    tabs: { keys: "API keys", clients: "OAuth apps", apps: "Connected apps" },
    keys: {
      empty: "No API keys yet. Create one to call the REST API.",
      label: "Name (e.g. Zapier, my script)",
      create: "Create key",
      created: "Copy your key now — it will not be shown again.",
      lastUsed: "Last used",
      never: "never",
      revoke: "Revoke",
      confirm: "Revoke this key? Anything using it will stop working.",
      hint: "Send it as Authorization: Bearer rm_… to https://backend.reelmotion.ai/api/v1/…",
    },
    clients: {
      empty: "Register an OAuth app if you are building a platform where Reelmotion users sign in with their own account.",
      name: "App name",
      redirects: "Redirect URIs (one per line)",
      create: "Register app",
      secret: "Client secret — copy it now, it will not be shown again.",
      rotate: "Rotate secret",
      delete: "Delete",
      confirmDelete: "Delete this app? Every user connection to it will be revoked.",
      clientId: "Client ID",
    },
    apps: {
      empty: "No external apps have access to your account.",
      granted: "Connected",
      lastUsed: "Last used",
      revoke: "Disconnect",
      confirm: "Disconnect this app? It will lose access immediately.",
      mcp: "Connect from Claude, ChatGPT or Cursor with the MCP URL",
    },
    scopes: {
      profile: "Read profile & balance",
      billing: "Generate purchase links",
      generate: "Create generations (spends tokens)",
      "tasks:read": "Read generation results",
    },
    copy: "Copy",
    copied: "Copied",
    error: "Something went wrong",
  },
  es: {
    title: "API e Integraciones",
    subtitle: "Usa tus tokens de Reelmotion desde otras plataformas, scripts o asistentes de IA (Claude, ChatGPT, Cursor).",
    docs: "Documentación para desarrolladores",
    tabs: { keys: "API keys", clients: "Apps OAuth", apps: "Apps conectadas" },
    keys: {
      empty: "Aún no tienes API keys. Crea una para usar la API REST.",
      label: "Nombre (ej. Zapier, mi script)",
      create: "Crear key",
      created: "Copia tu key ahora — no se volverá a mostrar.",
      lastUsed: "Último uso",
      never: "nunca",
      revoke: "Revocar",
      confirm: "¿Revocar esta key? Todo lo que la use dejará de funcionar.",
      hint: "Envíala como Authorization: Bearer rm_… a https://backend.reelmotion.ai/api/v1/…",
    },
    clients: {
      empty: "Registra una app OAuth si construyes una plataforma donde los usuarios de Reelmotion inician sesión con su propia cuenta.",
      name: "Nombre de la app",
      redirects: "Redirect URIs (una por línea)",
      create: "Registrar app",
      secret: "Client secret — cópialo ahora, no se volverá a mostrar.",
      rotate: "Rotar secret",
      delete: "Eliminar",
      confirmDelete: "¿Eliminar esta app? Se revocarán todas las conexiones de usuarios.",
      clientId: "Client ID",
    },
    apps: {
      empty: "Ninguna app externa tiene acceso a tu cuenta.",
      granted: "Conectada",
      lastUsed: "Último uso",
      revoke: "Desconectar",
      confirm: "¿Desconectar esta app? Perderá el acceso de inmediato.",
      mcp: "Conéctate desde Claude, ChatGPT o Cursor con la URL MCP",
    },
    scopes: {
      profile: "Leer perfil y balance",
      billing: "Generar links de compra",
      generate: "Crear generaciones (gasta tokens)",
      "tasks:read": "Leer resultados",
    },
    copy: "Copiar",
    copied: "Copiado",
    error: "Algo salió mal",
  },
};

const MCP_URL = `${(import.meta.env.VITE_APP_BACKEND_URL || "").replace(/\/api\/?$/, "")}/mcp`;

function CopyButton({ value, t }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(value);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
    >
      {done ? <Check size={14} /> : <Copy size={14} />}
      {done ? t.copied : t.copy}
    </button>
  );
}

function Secret({ value, t }) {
  return (
    <div className="flex items-center gap-3 bg-black/40 border border-[#F2D543]/30 rounded-lg px-3 py-2 font-mono text-sm text-[#F2D543] break-all">
      <span className="flex-1">{value}</span>
      <CopyButton value={value} t={t} />
    </div>
  );
}

function formatDate(v) {
  return v ? new Date(v).toLocaleDateString() : null;
}

function ApiKeysTab({ t }) {
  const [keys, setKeys] = useState([]);
  const [label, setLabel] = useState("");
  const [scopes, setScopes] = useState(SCOPES);
  const [fresh, setFresh] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = () => listApiKeys().then(setKeys).catch((e) => setError(e.message));
  useEffect(() => {
    reload();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const created = await createApiKey(label.trim(), scopes);
      setFresh(created.key);
      setLabel("");
      reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (id) => {
    if (!window.confirm(t.keys.confirm)) return;
    await revokeApiKey(id).catch((e) => setError(e.message));
    reload();
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="bg-darkBoxSub rounded-lg p-4 space-y-3">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={t.keys.label}
          required
          maxLength={60}
          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#DC569D]"
        />
        <div className="flex flex-wrap gap-3">
          {SCOPES.map((s) => (
            <label key={s} className="flex items-center gap-2 text-xs text-gray-300">
              <input
                type="checkbox"
                checked={scopes.includes(s)}
                onChange={(e) => setScopes(e.target.checked ? [...scopes, s] : scopes.filter((x) => x !== s))}
                className="accent-[#DC569D]"
              />
              {t.scopes[s]}
            </label>
          ))}
        </div>
        <button
          type="submit"
          disabled={busy || scopes.length === 0}
          className="bg-[#F2D543] text-black montserrat-medium text-sm px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {t.keys.create}
        </button>
        {fresh && (
          <div className="space-y-2">
            <p className="text-xs text-[#F2D543]">{t.keys.created}</p>
            <Secret value={fresh} t={t} />
            <p className="text-xs text-gray-500">{t.keys.hint}</p>
          </div>
        )}
      </form>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {keys.length === 0 ? (
        <p className="text-sm text-gray-500">{t.keys.empty}</p>
      ) : (
        <ul className="divide-y divide-white/5">
          {keys.map((k) => (
            <li key={k.id} className="flex items-center justify-between py-3 gap-4">
              <div className="min-w-0">
                <p className="text-white text-sm montserrat-medium truncate">{k.label}</p>
                <p className="text-xs text-gray-500 font-mono">
                  rm_…{k.last4} · {(k.scopes || []).join(", ")} · {t.keys.lastUsed}: {formatDate(k.last_used_at) || t.keys.never}
                </p>
              </div>
              <button onClick={() => revoke(k.id)} className="text-xs text-gray-400 hover:text-red-400 inline-flex items-center gap-1">
                <Trash2 size={14} /> {t.keys.revoke}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OAuthClientsTab({ t }) {
  const [clients, setClients] = useState([]);
  const [name, setName] = useState("");
  const [redirects, setRedirects] = useState("");
  const [secret, setSecret] = useState(null);
  const [error, setError] = useState("");

  const reload = () => listOAuthClients().then(setClients).catch((e) => setError(e.message));
  useEffect(() => {
    reload();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const created = await createOAuthClient({
        name: name.trim(),
        redirect_uris: redirects.split("\n").map((s) => s.trim()).filter(Boolean),
      });
      setSecret({ id: created.id, value: created.client_secret });
      setName("");
      setRedirects("");
      reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const rotate = async (id) => {
    const r = await rotateOAuthClientSecret(id).catch((e) => setError(e.message));
    if (r) setSecret({ id, value: r.client_secret });
  };

  const remove = async (id) => {
    if (!window.confirm(t.clients.confirmDelete)) return;
    await deleteOAuthClient(id).catch((e) => setError(e.message));
    reload();
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="bg-darkBoxSub rounded-lg p-4 space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.clients.name}
          required
          maxLength={80}
          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#DC569D]"
        />
        <textarea
          value={redirects}
          onChange={(e) => setRedirects(e.target.value)}
          placeholder={`${t.clients.redirects}\nhttps://myapp.com/oauth/callback`}
          required
          rows={3}
          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#DC569D]"
        />
        <button type="submit" className="bg-[#F2D543] text-black montserrat-medium text-sm px-4 py-2 rounded-lg">
          {t.clients.create}
        </button>
      </form>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {clients.length === 0 ? (
        <p className="text-sm text-gray-500">{t.clients.empty}</p>
      ) : (
        <ul className="space-y-3">
          {clients.map((c) => (
            <li key={c.id} className="bg-darkBoxSub rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between gap-4">
                <p className="text-white text-sm montserrat-medium">{c.name}</p>
                <div className="flex items-center gap-3">
                  <button onClick={() => rotate(c.id)} className="text-xs text-gray-400 hover:text-white inline-flex items-center gap-1">
                    <RefreshCw size={14} /> {t.clients.rotate}
                  </button>
                  <button onClick={() => remove(c.id)} className="text-xs text-gray-400 hover:text-red-400 inline-flex items-center gap-1">
                    <Trash2 size={14} /> {t.clients.delete}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                <span>{t.clients.clientId}:</span>
                <span className="text-gray-200 break-all">{c.id}</span>
                <CopyButton value={c.id} t={t} />
              </div>
              <p className="text-xs text-gray-500 font-mono break-all">{(c.redirect_uris || []).join("  ·  ")}</p>
              {secret?.id === c.id && (
                <div className="space-y-1">
                  <p className="text-xs text-[#F2D543]">{t.clients.secret}</p>
                  <Secret value={secret.value} t={t} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ConnectedAppsTab({ t }) {
  const [apps, setApps] = useState([]);
  const [error, setError] = useState("");

  const reload = () => listAuthorizations().then(setApps).catch((e) => setError(e.message));
  useEffect(() => {
    reload();
  }, []);

  const revoke = async (clientId) => {
    if (!window.confirm(t.apps.confirm)) return;
    await revokeAuthorization(clientId).catch((e) => setError(e.message));
    reload();
  };

  return (
    <div className="space-y-4">
      <div className="bg-darkBoxSub rounded-lg p-4">
        <p className="text-xs text-gray-400 mb-2">{t.apps.mcp}</p>
        <div className="flex items-center gap-3 font-mono text-sm text-white break-all">
          <span className="flex-1">{MCP_URL}</span>
          <CopyButton value={MCP_URL} t={t} />
        </div>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {apps.length === 0 ? (
        <p className="text-sm text-gray-500">{t.apps.empty}</p>
      ) : (
        <ul className="divide-y divide-white/5">
          {apps.map((a) => (
            <li key={a.client_id} className="flex items-center justify-between py-3 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {a.logo_uri ? (
                  <img src={a.logo_uri} alt="" className="w-8 h-8 rounded-md object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-md bg-black/30 flex items-center justify-center text-gray-500">
                    <Plug size={16} />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-white text-sm montserrat-medium truncate">{a.name}</p>
                  <p className="text-xs text-gray-500">
                    {(a.scopes || []).map((s) => t.scopes[s] || s).join(" · ")} · {t.apps.granted} {formatDate(a.granted_at)}
                    {a.last_used_at ? ` · ${t.apps.lastUsed} ${formatDate(a.last_used_at)}` : ""}
                  </p>
                </div>
              </div>
              <button onClick={() => revoke(a.client_id)} className="text-xs text-gray-400 hover:text-red-400 whitespace-nowrap">
                {t.apps.revoke}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const TABS = [
  { id: "keys", icon: KeyRound, Component: ApiKeysTab },
  { id: "apps", icon: ShieldCheck, Component: ConnectedAppsTab },
  { id: "clients", icon: Plug, Component: OAuthClientsTab },
];

export default function ApiIntegrations() {
  const { locale } = useI18n();
  const t = strings[locale] || strings.en;
  const [tab, setTab] = useState("keys");
  const Active = TABS.find((x) => x.id === tab).Component;

  return (
    <div className="bg-darkBox rounded-2xl p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-6">
        <div>
          <h4 className="text-white montserrat-medium text-lg">{t.title}</h4>
          <p className="text-gray-400 montserrat-light text-sm mt-1">{t.subtitle}</p>
        </div>
        <Link to="/developers" className="inline-flex items-center gap-2 text-sm text-[#F2D543] hover:underline whitespace-nowrap">
          <BookOpen size={16} /> {t.docs}
        </Link>
      </div>

      <div className="flex gap-2 mb-5 border-b border-white/5">
        {TABS.map(({ id, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 px-3 py-2 text-sm border-b-2 -mb-px transition-colors ${
              tab === id ? "border-[#DC569D] text-white" : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <Icon size={15} /> {t.tabs[id]}
          </button>
        ))}
      </div>

      <Active t={t} />
    </div>
  );
}
