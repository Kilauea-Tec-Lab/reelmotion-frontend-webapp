import { useState } from "react";
import { useLoaderData } from "react-router-dom";
import { Briefcase, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useI18n } from "../i18n/i18n-context";
import { ConfirmDelete, Mono } from "../studio/components/ui";
import { BTN_PRIMARY, CARD } from "../studio/components/tokens";
import BrandForm from "./brand-form";
import { MAX_BRANDS, deleteBrand, listBrands, setDefaultBrand } from "./functions";
import { UI } from "./brand-fields";

const swatches = (b) => [b.colors?.primary, b.colors?.secondary, b.colors?.accent, ...(b.colors?.extra || [])].filter(Boolean);

function BrandCard({ brand, ui, onEdit, onDelete, onDefault }) {
  const logo = brand.logos?.[0]?.url;
  return (
    <div className={`${CARD} p-4 flex flex-col gap-3`}>
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-lg bg-[#2f2f2f] flex items-center justify-center overflow-hidden shrink-0">
          {logo ? <img src={logo} alt="" className="h-full w-full object-contain" /> : <Briefcase className="text-gray-600" size={20} />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-white text-sm font-semibold truncate">{brand.name}</h3>
          <p className="text-xs text-gray-500 truncate">{brand.profile?.tagline || brand.profile?.industry || ""}</p>
        </div>
        {brand.is_default && <Mono className="!text-[#F2D543]">{ui.default}</Mono>}
      </div>
      <div className="flex gap-1.5 min-h-5">
        {swatches(brand).slice(0, 8).map((c) => <span key={c} title={c} className="h-5 w-5 rounded-full border border-gray-700" style={{ background: c }} />)}
      </div>
      <div className="flex gap-2 justify-end">
        {!brand.is_default && (
          <button onClick={() => onDefault(brand)} className="text-gray-400 hover:text-[#F2D543] p-1.5" title={ui.makeDefault}><Star size={16} /></button>
        )}
        <button onClick={() => onEdit(brand)} className="text-gray-400 hover:text-white p-1.5" title={ui.edit}><Pencil size={16} /></button>
        <button onClick={() => onDelete(brand)} className="text-gray-400 hover:text-[#DC569D] p-1.5" title={ui.delete}><Trash2 size={16} /></button>
      </div>
    </div>
  );
}

export default function Brands() {
  const { locale } = useI18n();
  const ui = UI[locale === "es" ? "es" : "en"];
  const [brands, setBrands] = useState(useLoaderData() || []);
  const [editing, setEditing] = useState(null); // null | {} (nueva) | brand
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => listBrands().then(setBrands);
  const onSaved = () => { setEditing(null); refresh(); };
  const onDefault = (b) => setDefaultBrand(b.id).then(refresh);
  const onDelete = async () => {
    setBusy(true);
    try { await deleteBrand(deleting.id); await refresh(); } finally { setBusy(false); setDeleting(null); }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-white">{ui.title}</h1>
            <p className="text-sm text-gray-400 mt-1 max-w-xl">{ui.subtitle}</p>
          </div>
          <button onClick={() => setEditing({})} disabled={brands.length >= MAX_BRANDS} title={brands.length >= MAX_BRANDS ? ui.limit : undefined} className={BTN_PRIMARY}>
            <Plus className="h-4 w-4" /> {ui.new}
          </button>
        </div>

        {brands.length === 0 ? (
          <p className="text-gray-500 text-sm py-16 text-center">{ui.empty}</p>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((b) => (
              <BrandCard key={b.id} brand={b} ui={ui} onEdit={setEditing} onDelete={setDeleting} onDefault={onDefault} />
            ))}
          </div>
        )}
      </div>

      {editing && <BrandForm brand={editing.id ? editing : null} onClose={() => setEditing(null)} onSaved={onSaved} />}
      {deleting && <ConfirmDelete title={`${ui.delete}: ${deleting.name}`} body={ui.deleteBody} busy={busy} onCancel={() => setDeleting(null)} onConfirm={onDelete} />}
    </div>
  );
}
