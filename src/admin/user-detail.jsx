import { useState } from "react";
import { Link, useLoaderData, useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import { useI18n } from "../i18n/i18n-context";
import { COUNTRIES } from "../lib/countries";
import { Avatar, DeleteUserModal } from "./users-admin";
import { fmtDate, fmtNum } from "./functions";

const ONBOARDING_FIELDS = ["company", "website", "country", "role", "team_size", "use_case", "monthly_volume", "budget", "source"];
const FREE_TEXT = ["company", "website", "country"];

function Card({ title, children, className = "" }) {
  return (
    <section className={`bg-darkBoxSub rounded-xl p-4 md:p-5 ${className}`}>
      <h2 className="text-sm font-medium text-gray-300 mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-darkBoxSub rounded-lg p-4">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="text-xl font-semibold text-[#F2D543] truncate">{value}</div>
    </div>
  );
}

/** Barras horizontales para los desgloses (tipo, estado, modelo). */
function Breakdown({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.total));
  if (!rows.length) return <p className="text-sm text-gray-500">—</p>;
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label ?? "none"} className="text-sm">
          <div className="flex justify-between gap-2 text-gray-300">
            <span className="truncate">{r.label || "—"}</span>
            <span className="text-gray-400">{fmtNum(r.total)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 mt-1">
            <div className="h-full rounded-full bg-[#DC569D]" style={{ width: `${(r.total / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function DailyChart({ daily }) {
  const { t } = useI18n();
  const [metric, setMetric] = useState("generations");
  const max = Math.max(1, ...daily.map((d) => d[metric]));
  return (
    <>
      <div className="flex gap-2 mb-4">
        {["generations", "tokens"].map((m) => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            className={`px-3 py-1 rounded-lg text-xs ${metric === m ? "bg-[#DC569D]/15 text-[#DC569D]" : "bg-white/5 text-gray-400 hover:text-white"}`}
          >
            {t(`admin.users.${m === "tokens" ? "tokens-spent" : "generations"}`)}
          </button>
        ))}
      </div>
      <div className="flex items-end gap-[3px] h-40">
        {daily.map((d) => (
          <div key={d.date} className="flex-1 h-full flex items-end group relative" title={`${d.date}: ${fmtNum(d[metric])}`}>
            <div className="w-full rounded-t bg-[#DC569D]/70 group-hover:bg-[#DC569D] min-h-[2px]" style={{ height: `${(d[metric] / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[11px] text-gray-500 mt-2">
        <span>{daily[0]?.date}</span>
        <span>{daily[daily.length - 1]?.date}</span>
      </div>
    </>
  );
}

function OnboardingAnswers({ user, answers }) {
  const { t } = useI18n();
  if (!answers) return <p className="text-sm text-gray-500">{t("admin.users.no-onboarding")}</p>;

  const value = (field) => {
    const v = answers[field];
    if (!v) return "—";
    if (field === "website" && /^https?:\/\//i.test(v)) {
      return (
        <a href={v} target="_blank" rel="noopener noreferrer" className="text-[#DC569D] hover:underline break-all">
          {v}
        </a>
      );
    }
    if (field === "country") {
      const c = COUNTRIES.find((x) => x.code === v);
      return c ? `${c.flag} ${c.name}` : v;
    }
    return FREE_TEXT.includes(field) ? v : t(`onboarding.${field}.${v}`);
  };

  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
      {ONBOARDING_FIELDS.map((f) => (
        <div key={f}>
          <dt className="text-gray-500 text-xs">{t(`onboarding.${f}`)}</dt>
          <dd className="text-white mt-0.5">{value(f)}</dd>
        </div>
      ))}
      <div>
        <dt className="text-gray-500 text-xs">{t("admin.users.lead-score")}</dt>
        <dd className="text-[#F2D543] mt-0.5">{user.lead_score ?? "—"}</dd>
      </div>
      <div>
        <dt className="text-gray-500 text-xs">{t("admin.users.completed-at")}</dt>
        <dd className="text-white mt-0.5">{fmtDate(user.onboarding_completed_at)}</dd>
      </div>
    </dl>
  );
}

function MiniTable({ cols, rows, empty }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-gray-400 text-xs">
          <tr>{cols.map((c) => <th key={c} className="py-2 pr-4 font-medium whitespace-nowrap">{c}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((r, i) => (
            <tr key={i}>{r.map((cell, j) => <td key={j} className="py-2 pr-4 text-gray-300 whitespace-nowrap">{cell}</td>)}</tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={cols.length} className="py-6 text-center text-gray-500">{empty}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function UserDetail() {
  const { user, onboarding, analytics: a } = useLoaderData();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const fullName = [user.name, user.last_name].filter(Boolean).join(" ") || user.username;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        <Link to="/app/users" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white">
          <ArrowLeft size={16} /> {t("admin.users.back")}
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Avatar user={user} size="h-14 w-14" />
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold truncate">{fullName}</h1>
              <p className="text-gray-400 text-sm truncate">{user.email} · @{user.username}</p>
              <p className="text-gray-500 text-xs">
                {t("admin.users.registered")}: {fmtDate(user.created_at)} · {t("admin.users.last-activity")}: {fmtDate(a.last_activity)}
              </p>
            </div>
          </div>
          <button onClick={() => setConfirming(true)} className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#DC569D]/15 text-[#DC569D] hover:bg-[#DC569D]/25">
            <Trash2 size={16} /> {t("sidebar.delete")}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label={t("admin.users.balance")} value={fmtNum(a.balance)} />
          <Stat label={t("admin.users.tokens-spent")} value={fmtNum(a.generations.tokens_spent)} />
          <Stat label={t("admin.users.generations")} value={fmtNum(a.generations.total)} />
          <Stat label={t("admin.users.purchased")} value={`$${fmtNum(a.purchases.total_usd)}`} />
          <Stat label={t("admin.users.chats")} value={fmtNum(a.chats_count)} />
          <Stat label={t("admin.users.messages")} value={fmtNum(a.messages_count)} />
          <Stat label={t("admin.users.projects")} value={fmtNum(a.studio_projects_count)} />
          <Stat label={t("admin.users.tokens-bought")} value={fmtNum(a.purchases.total_tokens)} />
        </div>

        <Card title={t("admin.users.last-30")}>
          <DailyChart daily={a.daily} />
        </Card>

        <div className="grid md:grid-cols-3 gap-4">
          <Card title={t("admin.users.by-type")}><Breakdown rows={a.generations.by_media_type} /></Card>
          <Card title={t("admin.users.by-status")}><Breakdown rows={a.generations.by_status} /></Card>
          <Card title={t("admin.users.by-model")}><Breakdown rows={a.generations.by_model} /></Card>
        </div>

        <Card title={t("admin.users.onboarding")}>
          <OnboardingAnswers user={user} answers={onboarding} />
        </Card>

        <Card title={t("admin.users.recent-generations")}>
          <MiniTable
            cols={[t("admin.users.date"), t("admin.users.type"), t("admin.users.model"), t("admin.users.status"), "Tokens", ""]}
            empty={t("admin.users.none")}
            rows={a.recent_generations.map((g) => [
              fmtDate(g.created_at),
              g.media_type,
              g.model,
              g.status,
              g.refunded ? <s className="text-gray-500">{fmtNum(g.tokens_charged)}</s> : fmtNum(g.tokens_charged),
              g.result_url ? (
                <a href={g.result_url} target="_blank" rel="noopener noreferrer" className="text-[#DC569D]"><ExternalLink size={14} /></a>
              ) : null,
            ])}
          />
        </Card>

        <Card title={t("admin.users.purchases")}>
          <MiniTable
            cols={[t("admin.users.date"), t("admin.users.provider"), "Tokens", "USD"]}
            empty={t("admin.users.no-purchases")}
            rows={a.purchases.recent.map((p) => [fmtDate(p.created_at), p.provider, fmtNum(p.tokens), p.amount_usd != null ? `$${fmtNum(p.amount_usd)}` : "—"])}
          />
        </Card>
      </div>

      {confirming && (
        <DeleteUserModal user={user} onClose={() => setConfirming(false)} onDeleted={() => navigate("/app/users", { replace: true })} />
      )}
    </div>
  );
}
