import { useState } from "react";
import { Copy, Plug, Trash2, RefreshCw, Check, KeyRound } from "lucide-react";
import {
  SCOPES,
  createApiKey,
  createOAuthClient,
  deleteOAuthClient,
  revokeApiKey,
  revokeAuthorization,
  rotateOAuthClientSecret,
} from "./api-functions";

const INPUT =
  "w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#DC569D] focus:ring-1 focus:ring-[#DC569D]/40 transition-colors";
const PRIMARY_BTN =
  "inline-flex items-center gap-2 bg-[#F2D543] hover:bg-[#f5dc5c] text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const GHOST_BTN = "inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors";
const DANGER_BTN = "inline-flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 transition-colors";

export function CopyButton({ value, t, className = "" }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(value);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className={`${GHOST_BTN} ${className}`}
    >
      {done ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
      {done ? t.copied : t.copy}
    </button>
  );
}

export function Secret({ value, t }) {
  return (
    <div className="flex items-center gap-3 bg-black/50 border border-[#F2D543]/40 rounded-lg px-3 py-2 font-mono text-sm text-[#F2D543] break-all shadow-[0_0_24px_-8px_rgba(242,213,67,0.5)]">
      <span className="flex-1">{value}</span>
      <CopyButton value={value} t={t} />
    </div>
  );
}

export function ScopeChips({ scopes, t }) {
  return (
    <div className="flex flex-wrap gap-1">
      {(scopes || []).map((s) => (
        <span key={s} title={t.scopes[s] || s} className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300">
          {s}
        </span>
      ))}
    </div>
  );
}

function formatDate(v) {
  return v ? new Date(v).toLocaleDateString() : null;
}

function Panel({ children }) {
  return <div className="rounded-xl border border-gray-800 bg-black/30 p-4 space-y-3">{children}</div>;
}

function Empty({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-3 text-sm text-gray-500 py-6 justify-center border border-dashed border-gray-800 rounded-xl">
      <Icon size={16} /> {children}
    </div>
  );
}

/** API keys: create + list + revoke. `onCreated(plainKey)` lets the page inject it into the quick-start snippets. */
export function ApiKeysTab({ t, keys, reload, onCreated }) {
  const [label, setLabel] = useState("");
  const [scopes, setScopes] = useState(SCOPES);
  const [fresh, setFresh] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const created = await createApiKey(label.trim(), scopes);
      setFresh(created.key);
      onCreated?.(created.key);
      setLabel("");
      await reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (id) => {
    if (!window.confirm(t.keys.confirm)) return;
    try {
      await revokeApiKey(id);
      await reload();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submit}>
        <Panel>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t.keys.label} required maxLength={60} className={INPUT} />
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {SCOPES.map((s) => (
              <label key={s} className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scopes.includes(s)}
                  onChange={(e) => setScopes(e.target.checked ? [...scopes, s] : scopes.filter((x) => x !== s))}
                  className="accent-[#DC569D]"
                />
                <span className="font-mono text-[11px] text-gray-500">{s}</span>
                {t.scopes[s]}
              </label>
            ))}
          </div>
          <button type="submit" disabled={busy || scopes.length === 0} className={PRIMARY_BTN}>
            <KeyRound size={14} /> {t.keys.create}
          </button>
          {fresh && (
            <div className="space-y-2 pt-1">
              <p className="text-xs text-[#F2D543]">{t.keys.created}</p>
              <Secret value={fresh} t={t} />
              <p className="text-xs text-gray-500 font-mono">{t.keys.hint}</p>
            </div>
          )}
        </Panel>
      </form>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {keys.length === 0 ? (
        <Empty icon={KeyRound}>{t.keys.empty}</Empty>
      ) : (
        <ul className="divide-y divide-white/5 rounded-xl border border-gray-800 overflow-hidden">
          {keys.map((k) => (
            <li key={k.id} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-white/[0.02] transition-colors">
              <div className="min-w-0 flex items-start gap-3">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] flex-shrink-0" />
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{k.label}</p>
                    <code className="text-xs text-gray-500 font-mono">rm_…{k.last4}</code>
                  </div>
                  <ScopeChips scopes={k.scopes} t={t} />
                  <p className="text-[11px] text-gray-500 font-mono">
                    {t.keys.created_at} {formatDate(k.created_at)} · {t.keys.lastUsed}: {formatDate(k.last_used_at) || t.keys.never}
                  </p>
                </div>
              </div>
              <button onClick={() => revoke(k.id)} className={DANGER_BTN}>
                <Trash2 size={14} /> {t.keys.revoke}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function OAuthClientsTab({ t, clients, reload }) {
  const [name, setName] = useState("");
  const [redirects, setRedirects] = useState("");
  const [secret, setSecret] = useState(null);
  const [error, setError] = useState("");

  const run = async (fn) => {
    setError("");
    try {
      await fn();
    } catch (err) {
      setError(err.message);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    run(async () => {
      const created = await createOAuthClient({
        name: name.trim(),
        redirect_uris: redirects.split("\n").map((s) => s.trim()).filter(Boolean),
      });
      setSecret({ id: created.id, value: created.client_secret });
      setName("");
      setRedirects("");
      await reload();
    });
  };

  const rotate = (id) =>
    run(async () => {
      const r = await rotateOAuthClientSecret(id);
      setSecret({ id, value: r.client_secret });
    });

  const remove = (id) => {
    if (!window.confirm(t.clients.confirmDelete)) return;
    run(async () => {
      await deleteOAuthClient(id);
      await reload();
    });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submit}>
        <Panel>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.clients.name} required maxLength={80} className={INPUT} />
          <textarea
            value={redirects}
            onChange={(e) => setRedirects(e.target.value)}
            placeholder={`${t.clients.redirects}\nhttps://myapp.com/oauth/callback`}
            required
            rows={3}
            className={`${INPUT} font-mono`}
          />
          <button type="submit" className={PRIMARY_BTN}>
            <Plug size={14} /> {t.clients.create}
          </button>
        </Panel>
      </form>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {clients.length === 0 ? (
        <Empty icon={Plug}>{t.clients.empty}</Empty>
      ) : (
        <ul className="space-y-3">
          {clients.map((c) => (
            <li key={c.id} className="rounded-xl border border-gray-800 bg-black/30 p-4 space-y-2">
              <div className="flex items-center justify-between gap-4">
                <p className="text-white text-sm font-medium">{c.name}</p>
                <div className="flex items-center gap-4">
                  <button onClick={() => rotate(c.id)} className={GHOST_BTN}>
                    <RefreshCw size={14} /> {t.clients.rotate}
                  </button>
                  <button onClick={() => remove(c.id)} className={DANGER_BTN}>
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
                <div className="space-y-1 pt-1">
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

export function ConnectedAppsTab({ t, apps, reload }) {
  const [error, setError] = useState("");

  const revoke = async (clientId) => {
    if (!window.confirm(t.apps.confirm)) return;
    try {
      await revokeAuthorization(clientId);
      await reload();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-400">{error}</p>}
      {apps.length === 0 ? (
        <Empty icon={Plug}>{t.apps.empty}</Empty>
      ) : (
        <ul className="divide-y divide-white/5 rounded-xl border border-gray-800 overflow-hidden">
          {apps.map((a) => (
            <li key={a.client_id} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                {a.logo_uri ? (
                  <img src={a.logo_uri} alt="" className="w-9 h-9 rounded-lg object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
                    <Plug size={16} />
                  </div>
                )}
                <div className="min-w-0 space-y-1">
                  <p className="text-white text-sm font-medium truncate">{a.name}</p>
                  <ScopeChips scopes={a.scopes} t={t} />
                  <p className="text-[11px] text-gray-500 font-mono">
                    {t.apps.granted} {formatDate(a.granted_at)}
                    {a.last_used_at ? ` · ${t.apps.lastUsed} ${formatDate(a.last_used_at)}` : ""}
                  </p>
                </div>
              </div>
              <button onClick={() => revoke(a.client_id)} className={`${DANGER_BTN} whitespace-nowrap`}>
                {t.apps.revoke}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
