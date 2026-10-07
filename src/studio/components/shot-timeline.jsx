import { Plus } from "lucide-react";
import { useI18n } from "../../i18n/i18n-context";
import ShotCard from "./shot-card";
import { Mono } from "./ui";

// Conector entre dos tomas: muestra cómo se encadena la de la derecha con la anterior.
const CHAIN_GLYPH = {
  none: "·",
  last_frame: "→",
  extend: "⟶",
  keyframes: "→",
};

function Connector({ mode }) {
  const active = mode && mode !== "none";
  return (
    <div className="flex flex-col items-center justify-center w-16 shrink-0 h-32">
      <div className={`w-full h-px ${active ? "bg-[#DC569D]/70 shadow-[0_0_8px_rgba(220,86,157,0.6)]" : "bg-gray-800"}`} />
      <Mono className={`mt-1 text-center leading-tight ${active ? "text-[#DC569D]" : ""}`}>
        <span className="block text-sm">{CHAIN_GLYPH[mode] || "·"}</span>
        {active ? (mode === "keyframes" ? "last frame" : mode.replace("_", " ")) : ""}
      </Mono>
    </div>
  );
}

export default function ShotTimeline({ shots, generatingIds, onAdd, onGenerate, onContinue, onExtend, onEditVideo, onEdit, onPreview, onDelete, onMove }) {
  const { t } = useI18n();

  return (
    <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden">
      <div className="flex items-start gap-0 p-4 md:p-6 min-w-max">
        {shots.map((shot, i) => (
          <div key={shot.id} className="flex items-start">
            {i > 0 && <Connector mode={shot.chain_mode} />}
            <ShotCard
              shot={shot}
              isFirst={i === 0}
              isLast={i === shots.length - 1}
              generating={generatingIds.has(shot.id)}
              onGenerate={onGenerate}
              onContinue={onContinue}
              onExtend={onExtend}
              onEditVideo={onEditVideo}
              onEdit={onEdit}
              onPreview={onPreview}
              onDelete={onDelete}
              onMove={onMove}
            />
          </div>
        ))}
        {shots.length > 0 && <Connector mode="none" />}
        <button
          onClick={onAdd}
          className="w-56 shrink-0 h-64 rounded-xl border border-dashed border-gray-700 hover:border-[#DC569D]/70 hover:shadow-[0_0_24px_rgba(220,86,157,0.12)] flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-white transition-all"
        >
          <Plus className="h-6 w-6" />
          <span className="text-sm">{t("studio.add-shot")}</span>
          {shots.length > 0 && <Mono>{t("studio.add-shot-hint")}</Mono>}
        </button>
      </div>
    </div>
  );
}
