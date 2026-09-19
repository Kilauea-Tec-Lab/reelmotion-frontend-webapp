import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Cookies from "js-cookie";
import { BookOpen, KeyRound, Plug, ShieldCheck, Coins, Terminal, Bot } from "lucide-react";
import { useI18n } from "../i18n/i18n-context";
import { listApiKeys, listAuthorizations, listOAuthClients } from "./api-functions";
import { MCP, samples } from "./content";
import { ApiKeysTab, ConnectedAppsTab, CopyButton, OAuthClientsTab } from "./api-tabs";
import { MCP_URL, strings } from "./console-strings";

const TABS = [
  { id: "keys", icon: KeyRound, Component: ApiKeysTab },
  { id: "apps", icon: ShieldCheck, Component: ConnectedAppsTab },
  { id: "clients", icon: Plug, Component: OAuthClientsTab },
];

const SNIPPETS = [
  { id: "curl", sample: "curlMe" },
  { id: "claude", sample: "claudeCode" },
  { id: "cursor", sample: "cursor" },
  { id: "header", sample: "mcpApiKey" },
];

const ASSISTANTS = [
  { id: "claude", icon: Bot },
  { id: "chatgpt", icon: Bot },
  { id: "cursor", icon: Terminal },
];

async function fetchBalance() {
  const r = await fetch(`${import.meta.env.VITE_APP_BACKEND_URL}users/tokens`, {
    headers: { Accept: "application/json", Authorization: "Bearer " + Cookies.get("token") },
  });
  const j = await r.json();
  return Number(j.data) || 0;
}

function Tile({ label, value, icon: Icon, accent }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-800 bg-[#171717] p-4">
      <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-30 ${accent}`} />
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-wider text-gray-500">{label}</p>
        <Icon size={14} className="text-gray-500" />
      </div>
      <p className="mt-2 text-3xl font-mono font-semibold text-white tabular-nums">{value ?? "—"}</p>
    </div>
  );
}

function QuickStart({ t, freshKey }) {
  const [active, setActive] = useState("curl");
  const code = samples[SNIPPETS.find((s) => s.id === active).sample]
    .replaceAll(MCP, MCP_URL)
    .replaceAll("rm_YOUR_API_KEY", freshKey || "rm_YOUR_API_KEY");

  return (
    <section className="rounded-2xl border border-gray-800 bg-[#171717] overflow-hidden shadow-[0_0_60px_-30px_rgba(220,86,157,0.6)]">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-800 bg-black/40">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>
        <p className="font-mono text-xs text-gray-400">{t.quick.title}</p>
        <div className="ml-auto flex gap-1 overflow-x-auto">
          {SNIPPETS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`font-mono text-[11px] px-2 py-1 rounded-md whitespace-nowrap transition-colors ${
                active === s.id ? "bg-[#DC569D]/20 text-[#DC569D] border border-[#DC569D]/40" : "text-gray-500 hover:text-white border border-transparent"
              }`}
            >
              {t.quick.tabs[s.id]}
            </button>
          ))}
        </div>
      </div>
      <div className="relative">
        <pre className="p-4 pr-20 overflow-x-auto font-mono text-xs leading-relaxed text-gray-200 bg-[#0d0d0d]">
          <code>{code}</code>
        </pre>
        <CopyButton value={code} t={t} className="absolute top-3 right-3 bg-black/60 border border-white/10 rounded-md px-2 py-1" />
      </div>
      <p className="px-4 py-2 text-[11px] text-gray-500 border-t border-gray-800">{t.quick.hint}</p>
    </section>
  );
}

function McpCards({ t }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-white font-semibold text-sm">{t.mcp.title}</h2>
        <div className="flex items-center gap-2 font-mono text-[11px] text-gray-400 min-w-0">
          <span className="text-gray-600">{t.mcp.url}</span>
          <span className="truncate text-gray-200">{MCP_URL}</span>
          <CopyButton value={MCP_URL} t={t} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {ASSISTANTS.map(({ id, icon: Icon }) => (
          <div key={id} className="group rounded-2xl border border-gray-800 bg-[#171717] p-4 hover:border-[#DC569D]/40 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#F2D543]">
                <Icon size={16} />
              </div>
              <p className="text-white text-sm font-medium">{t.mcp[id].name}</p>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">{t.mcp[id].how}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function DeveloperConsole() {
  const { locale } = useI18n();
  const t = strings[locale] || strings.en;
  const [tab, setTab] = useState("keys");
  const [data, setData] = useState({ keys: [], apps: [], clients: [], balance: null });
  const [loadError, setLoadError] = useState("");
  const [freshKey, setFreshKey] = useState(null);

  // One load feeds the tiles and every tab; tabs call reload() after mutations.
  const reload = useCallback(async () => {
    try {
      const [keys, apps, clients, balance] = await Promise.all([
        listApiKeys(),
        listAuthorizations(),
        listOAuthClients(),
        fetchBalance().catch(() => null),
      ]);
      setData({ keys, apps, clients, balance });
      setLoadError("");
    } catch (err) {
      setLoadError(err.message || t.error);
    }
  }, [t.error]);

  useEffect(() => {
    reload();
  }, [reload]);

  const Active = TABS.find((x) => x.id === tab).Component;
  const tabProps = { keys: data.keys, apps: data.apps, clients: data.clients };

  return (
    <main className="relative flex-1 overflow-y-auto bg-[#212121]">
      {/* subtle grid + glow, purely decorative */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse at top, black 30%, transparent 75%)",
        }}
      />
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/3 w-[40rem] h-[40rem] rounded-full bg-[#DC569D]/10 blur-3xl" />

      <div className="relative max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-[#DC569D] mb-1">{t.eyebrow}</p>
            <h1 className="text-2xl md:text-3xl font-semibold text-white">{t.title}</h1>
            <p className="text-sm text-gray-400 mt-1 max-w-2xl">{t.subtitle}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-2 font-mono text-[11px] text-gray-300 bg-black/40 border border-gray-800 rounded-full px-3 py-1.5">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-400" />
              </span>
              {t.online}
            </span>
            <Link to="/developers" className="inline-flex items-center gap-2 text-sm text-[#F2D543] hover:underline whitespace-nowrap">
              <BookOpen size={16} /> {t.docs}
            </Link>
          </div>
        </header>

        <div className="grid gap-3 sm:grid-cols-3">
          <Tile label={t.tiles.keys} value={data.keys.length} icon={KeyRound} accent="bg-[#DC569D]" />
          <Tile label={t.tiles.apps} value={data.apps.length} icon={ShieldCheck} accent="bg-emerald-400" />
          <Tile label={t.tiles.balance} value={data.balance === null ? null : data.balance.toLocaleString()} icon={Coins} accent="bg-[#F2D543]" />
        </div>

        <QuickStart t={t} freshKey={freshKey} />
        <McpCards t={t} />

        <section className="rounded-2xl border border-gray-800 bg-[#171717] p-4 md:p-6">
          <div className="inline-flex gap-1 p-1 rounded-lg bg-black/40 border border-gray-800 mb-5">
            {TABS.map(({ id, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-md transition-colors ${
                  tab === id ? "bg-[#DC569D] text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                <Icon size={14} /> {t.tabs[id]}
              </button>
            ))}
          </div>
          {loadError && <p className="text-sm text-red-400 mb-3">{loadError}</p>}
          <Active t={t} reload={reload} onCreated={setFreshKey} {...tabProps} />
        </section>
      </div>
    </main>
  );
}
