import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { useI18n } from "../i18n/i18n-context";
import LanguageSelector from "../i18n/language-selector";
import SEO from "../components/seo";
import { API, BASE, MCP, content, samples } from "./content";

function Code({ children, lang = "bash" }) {
  const [done, setDone] = useState(false);
  return (
    <div className="relative group">
      <pre className="bg-[#111114] border border-white/5 rounded-xl p-4 overflow-x-auto text-[13px] leading-relaxed text-gray-200 font-mono">
        <code data-lang={lang}>{children}</code>
      </pre>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(children);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        }}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-white/5 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Copy"
      >
        {done ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  );
}

function Section({ id, number, title, children }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <h2 className="text-2xl font-semibold text-white flex items-baseline gap-2">
        <span className="text-[#DC569D] font-mono text-sm">{number}.</span>
        {title}
      </h2>
      <div className="text-gray-400 leading-relaxed space-y-4">{children}</div>
    </section>
  );
}

function H3({ children }) {
  return <h3 className="text-white font-medium pt-2">{children}</h3>;
}

function Table({ cols, rows, mono = [] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/5">
      <table className="w-full text-sm text-left">
        <thead className="bg-white/5 text-gray-300">
          <tr>{cols.map((c) => <th key={c} className="px-3 py-2 font-medium whitespace-nowrap">{c}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((cell, j) => (
                <td key={j} className={`px-3 py-2 align-top ${mono.includes(j) ? "font-mono text-xs text-[#F2D543] whitespace-nowrap" : "text-gray-400"}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function priceLabel(p) {
  if (!p) return "";
  if (p.tokens_per_second !== undefined) return `${p.tokens_per_second} tok/s${p.min_seconds ? ` (min ${p.min_seconds}s)` : ""}`;
  if (p.tokens_per_image !== undefined) return `${p.tokens_per_image} tok/image`;
  if (p.tokens_per_request !== undefined) return `${p.tokens_per_request} tok/request`;
  if (p.tokens_per_1000_chars !== undefined) return `${p.tokens_per_1000_chars} tok/1000 chars`;
  return JSON.stringify(p);
}

function ModelsTable({ t }) {
  const [models, setModels] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    fetch(`${API}/models`, { headers: { Accept: "application/json" } })
      .then((r) => r.json())
      .then((j) => setModels(j.data))
      .catch(() => setFailed(true));
  }, []);
  if (failed) return <p className="text-sm text-gray-500">{t.failed}</p>;
  if (!models) return <p className="text-sm text-gray-500">{t.loading}</p>;
  return (
    <Table
      cols={t.cols}
      mono={[0]}
      rows={models.map((m) => [
        m.id,
        m.type,
        m.durations ? `${m.durations[0]}–${m.durations[1]}s` : "—",
        m.aspect_ratios ? m.aspect_ratios.join(" ") : "—",
        priceLabel(m.pricing),
      ])}
    />
  );
}

export default function DevelopersPage() {
  const { locale } = useI18n();
  const t = content[locale] || content.en;
  const ids = ["quickstart", "auth", "oauth", "endpoints", "tasks", "models", "billing", "mcp"];

  return (
    <div className="bg-[#0C0C0D] text-white">
      <SEO
        title="Reelmotion API & MCP — Developers"
        description="REST API, OAuth 2.1 and MCP server to generate AI images, videos and audio with Reelmotion tokens from any platform or AI assistant."
        url="https://reelmotion.ai/developers"
        lang={locale}
      />
      <div className="sticky top-0 z-10 border-b border-white/5 bg-[#0C0C0D]/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm">
            <ArrowLeft size={16} />
            {t.back}
          </Link>
          <LanguageSelector />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-16 pb-10">
        <div className="flex items-center gap-3 mb-6">
          <img src="/logos/logo_reelmotion_new.webp" alt="Reelmotion AI" className="h-8" />
          <span className="text-xs font-mono text-gray-600 uppercase tracking-widest">{t.badge}</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">{t.title}</h1>
        <p className="text-gray-400 max-w-2xl">{t.subtitle}</p>
        <div className="h-px w-full mt-10" style={{ background: "linear-gradient(to right, rgba(220,86,157,0.3), transparent)" }} />
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-24 grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-12">
        <nav className="hidden lg:block sticky top-24 self-start space-y-2 text-sm">
          {t.nav.map((label, i) => (
            <a key={ids[i]} href={`#${ids[i]}`} className="block text-gray-500 hover:text-white transition-colors">
              <span className="font-mono text-xs text-[#DC569D] mr-2">{i + 1}.</span>{label}
            </a>
          ))}
        </nav>

        <div className="space-y-16 min-w-0">
          <Section id="quickstart" number="1" title={t.quickstart.title}>
            <p><span className="text-gray-500">{t.quickstart.base}:</span> <code className="font-mono text-[#F2D543]">{API}</code></p>
            <ol className="list-decimal ml-5 space-y-2">{t.quickstart.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
            <Code>{samples.curlMe}</Code>
            <Code>{samples.curlImage}</Code>
            <Code>{samples.curlPoll}</Code>
            <H3>JavaScript</H3>
            <Code lang="js">{samples.js}</Code>
            <H3>Python</H3>
            <Code lang="python">{samples.python}</Code>
          </Section>

          <Section id="auth" number="2" title={t.auth.title}>
            <p>{t.auth.p1}</p>
            <ul className="list-disc ml-5 space-y-2">
              <li>{t.auth.keys}</li>
              <li>{t.auth.oauth}</li>
            </ul>
            <H3>{t.auth.scopes}</H3>
            <Table cols={["Scope", ""]} mono={[0]} rows={Object.entries(t.auth.scopeList)} />
            <p className="text-sm">{t.auth.limits}</p>
          </Section>

          <Section id="oauth" number="3" title={t.oauth.title}>
            <p>{t.oauth.p1}</p>
            <H3>{t.oauth.wellKnown}</H3>
            <Code>{`${BASE}/.well-known/oauth-authorization-server\n${BASE}/.well-known/oauth-protected-resource`}</Code>
            <p>{t.oauth.register}</p>
            <Code>{samples.dcr}</Code>
            <H3>{t.oauth.step1}</H3>
            <p>{t.oauth.step1p}</p>
            <Code>{samples.oauthAuthorize}</Code>
            <H3>{t.oauth.step2}</H3>
            <p>{t.oauth.step2p}</p>
            <Code>{samples.oauthToken}</Code>
            <H3>{t.oauth.step3}</H3>
            <p>{t.oauth.step3p}</p>
            <Code>{samples.oauthRefresh}</Code>
            <p className="text-sm">{t.oauth.revoke}</p>
          </Section>

          <Section id="endpoints" number="4" title={t.endpoints.title}>
            <Table cols={t.endpoints.cols} mono={[0, 1, 2]} rows={t.endpoints.rows} />
            <p className="text-sm">{t.endpoints.inputs}</p>
            <Code>{samples.curlVideo}</Code>
            <Code>{samples.curlAudio}</Code>
          </Section>

          <Section id="tasks" number="5" title={t.tasks.title}>
            <p>{t.tasks.p1}</p>
            <Code lang="json">{samples.task}</Code>
            <p>{t.tasks.errors}</p>
            <Table cols={["", ""]} mono={[0]} rows={t.tasks.table} />
            <Code lang="json">{samples.error402}</Code>
          </Section>

          <Section id="models" number="6" title={t.models.title}>
            <p>{t.models.p1}</p>
            <ModelsTable t={t.models} />
          </Section>

          <Section id="billing" number="7" title={t.billing.title}>
            <p>{t.billing.p1}</p>
            <Code>{samples.billing}</Code>
          </Section>

          <Section id="mcp" number="8" title={t.mcp.title}>
            <p>{t.mcp.p1}</p>
            <p><span className="text-gray-500">{t.mcp.url}:</span> <code className="font-mono text-[#F2D543]">{MCP}</code></p>
            <H3>{t.mcp.tools}</H3>
            <Table cols={["Tool", ""]} mono={[0]} rows={t.mcp.toolList} />
            <H3>{t.mcp.claude}</H3>
            <ol className="list-decimal ml-5 space-y-1">{t.mcp.claudeSteps.map((s, i) => <li key={i}>{s}</li>)}</ol>
            <H3>{t.mcp.claudeCode}</H3>
            <Code>{samples.claudeCode}</Code>
            <H3>{t.mcp.chatgpt}</H3>
            <ol className="list-decimal ml-5 space-y-1">{t.mcp.chatgptSteps.map((s, i) => <li key={i}>{s}</li>)}</ol>
            <H3>{t.mcp.cursor}</H3>
            <Code lang="json">{samples.cursor}</Code>
            <H3>{t.mcp.apiKey}</H3>
            <Code lang="json">{samples.mcpApiKey}</Code>
          </Section>
        </div>
      </div>
    </div>
  );
}
