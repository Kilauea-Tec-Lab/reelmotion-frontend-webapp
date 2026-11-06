import { Link, useLoaderData, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useI18n } from "../i18n/i18n-context";
import { fmtNum } from "./functions";

/** Lo que los usuarios le piden al agente del editor. Solo texto; el backend borra a los 90 días. */
export default function AgentTurns() {
  const { t } = useI18n();
  const { data: turns, current_page: page, last_page: lastPage, total } = useLoaderData();
  const [params, setParams] = useSearchParams();

  const search = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    setParams(Object.fromEntries([...form].filter(([, value]) => value)));
  };
  const goTo = (next) => {
    const copy = new URLSearchParams(params);
    copy.set("page", next);
    setParams(copy);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 text-white">
      <div className="max-w-5xl mx-auto">
        <Link to="/app/users" className="text-sm text-gray-400 hover:text-white">{t("admin.users.title")}</Link>
        <h1 className="text-2xl md:text-3xl font-semibold mt-1">{t("admin.turns.title")}</h1>
        <p className="text-gray-400 text-sm mt-1 mb-6">{t("admin.turns.subtitle", { total: fmtNum(total) })}</p>

        <form onSubmit={search} className="flex flex-col sm:flex-row gap-3 mb-6">
          <label className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              name="q"
              defaultValue={params.get("q") || ""}
              maxLength={200}
              aria-label={t("admin.turns.search")}
              placeholder={t("admin.turns.search")}
              className="w-full bg-[#2f2f2f] border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#DC569D]"
            />
          </label>
          <input
            name="user"
            defaultValue={params.get("user") || ""}
            maxLength={200}
            aria-label={t("admin.turns.user")}
            placeholder={t("admin.turns.user")}
            className="sm:w-64 bg-[#2f2f2f] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#DC569D]"
          />
          <button className="bg-[#DC569D] hover:bg-[#c74d8e] rounded-lg px-4 py-2 text-sm font-medium">{t("admin.turns.filter")}</button>
        </form>

        {turns.length === 0 && <p className="text-gray-400 text-sm">{t("admin.turns.empty")}</p>}

        <div className="space-y-3">
          {turns.map((turn) => (
            <article key={turn.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-sm">
              <p className="text-xs text-gray-500 mb-2">
                {turn.user?.email ?? t("admin.turns.deleted-user")} · {new Date(turn.created_at).toLocaleString()} · {turn.model}
              </p>
              <p className="whitespace-pre-wrap text-white">{turn.user_text}</p>
              {turn.attachments?.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">📎 {turn.attachments.map((a) => `${a.kind}: ${a.name}`).join(", ")}</p>
              )}
              {turn.assistant_text && <p className="whitespace-pre-wrap text-gray-400 mt-2">{turn.assistant_text}</p>}
              {turn.tools?.length > 0 && (
                <details className="mt-2 text-xs text-gray-500">
                  <summary className="cursor-pointer hover:text-gray-300">{t("admin.turns.tools", { count: turn.tools.length })}</summary>
                  <ul className="mt-1 space-y-1">
                    {turn.tools.map((tool, i) => (
                      <li key={i} className="break-all"><span className="text-gray-300">{tool.name}</span> {tool.args}</li>
                    ))}
                  </ul>
                </details>
              )}
            </article>
          ))}
        </div>

        {lastPage > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6 text-sm text-gray-400">
            <button onClick={() => goTo(page - 1)} disabled={page <= 1} aria-label="Previous page" className="disabled:opacity-30"><ChevronLeft size={18} /></button>
            {page} / {lastPage}
            <button onClick={() => goTo(page + 1)} disabled={page >= lastPage} aria-label="Next page" className="disabled:opacity-30"><ChevronRight size={18} /></button>
          </div>
        )}
      </div>
    </div>
  );
}
