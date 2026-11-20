import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Check } from "lucide-react";
import { useI18n } from "../i18n/i18n-context";
import { listBrands } from "./functions";
import { setBrandChoice } from "./selection";

/**
 * Selector de marca junto al input del chat. Chat nuevo: preselecciona la predeterminada.
 * Chat existente: muestra la guardada en el chat; cambiarla se manda con el siguiente mensaje.
 */
export default function BrandPicker({ chat }) {
  const { t } = useI18n();
  const chatId = typeof chat === "object" ? chat?.id : chat;
  const savedBrandId = typeof chat === "object" ? chat?.brand_id ?? null : null;
  const [brands, setBrands] = useState([]);
  const [selected, setSelected] = useState(savedBrandId);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    let alive = true;
    setBrandChoice(undefined);
    listBrands()
      .then((list) => {
        if (!alive) return;
        setBrands(list);
        if (!chatId) {
          const def = list.find((b) => b.is_default)?.id ?? null;
          setSelected(def);
          if (def) setBrandChoice(def);
        }
      })
      .catch(() => {}); // sin marcas el chat funciona igual
    return () => {
      alive = false;
      setBrandChoice(undefined);
    };
  }, [chatId]);

  useEffect(() => setSelected(savedBrandId), [savedBrandId]);

  useEffect(() => {
    if (!open) return;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  if (brands.length === 0) return null;

  const pick = (id) => {
    setSelected(id);
    setBrandChoice(id);
    setOpen(false);
  };
  const current = brands.find((b) => b.id === selected);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={t("brands.picker.label")}
        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-colors max-w-[9rem] ${current ? "text-white bg-[#DC569D]/20 hover:bg-[#DC569D]/30" : "text-gray-400 hover:bg-[#3a3a3a]"}`}
      >
        <Briefcase size={14} className="shrink-0" />
        <span className="truncate hidden sm:inline">{current?.name || t("brands.picker.none")}</span>
      </button>
      {open && (
        <div className="absolute bottom-full mb-2 left-0 z-30 min-w-[200px] bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-xl py-1">
          {[{ id: null, name: t("brands.picker.none") }, ...brands].map((b) => (
            <button
              type="button"
              key={b.id ?? "none"}
              onClick={() => pick(b.id)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-200 hover:bg-[#2f2f2f] text-left"
            >
              <Check size={14} className={selected === b.id ? "text-[#DC569D]" : "opacity-0"} />
              <span className="truncate">{b.name}</span>
            </button>
          ))}
          <Link to="/app/brands" className="block px-3 py-2 text-xs text-gray-500 hover:text-white border-t border-gray-800 mt-1">
            {t("brands.picker.manage")}
          </Link>
        </div>
      )}
    </div>
  );
}
