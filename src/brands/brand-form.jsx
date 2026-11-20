import { useEffect, useRef, useState } from "react";
import { FileText, Loader2, Plus, Save, Sparkles, Trash2, X } from "lucide-react";
import { useI18n } from "../i18n/i18n-context";
import { Modal, Mono } from "../studio/components/ui";
import { BTN_PRIMARY, BTN_SECONDARY, INPUT } from "../studio/components/tokens";
import { COLOR_KEYS, LOGO_KINDS, autofillBrand, createBrand, updateBrand, uploadImage } from "./functions";
import { COLOR_LABELS, LOGO_LABELS, OPTION_LABELS, SECTIONS, SOCIALS, UI } from "./brand-fields";

const HEX = /^#[0-9a-fA-F]{6}$/;
const toList = (raw) => raw.split(",").map((s) => s.trim()).filter(Boolean);

/** Lista separada por comas: se edita como texto y se convierte a array al salir del campo. */
function ListField({ value = [], onChange, placeholder }) {
  const [raw, setRaw] = useState(value.join(", "));
  return (
    <input
      value={raw}
      placeholder={placeholder}
      onChange={(e) => setRaw(e.target.value)}
      onBlur={() => onChange(toList(raw))}
      className={`${INPUT} mt-1`}
    />
  );
}

/** Muestra (abre el selector nativo) + hex editable a mano; así no hace falta pelear con el diálogo del sistema. */
function ColorField({ label, value, onChange }) {
  const [raw, setRaw] = useState(value || "");
  useEffect(() => setRaw(value || ""), [value]);
  const commit = () => {
    const v = raw.trim().startsWith("#") ? raw.trim() : `#${raw.trim()}`;
    if (!raw.trim()) onChange("");
    else if (HEX.test(v)) onChange(v.toUpperCase());
    else setRaw(value || "");
  };
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[#232323] border border-white/5 p-2">
      <label className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-lg ring-1 ring-white/15" style={{ background: value || "repeating-conic-gradient(#3a3a3a 0% 25%, #2a2a2a 0% 50%) 50% / 10px 10px" }}>
        <input type="color" value={value || "#000000"} onChange={(e) => onChange(e.target.value.toUpperCase())} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
      </label>
      <div className="min-w-0 flex-1">
        <Mono>{label}</Mono>
        <input
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), commit())}
          placeholder="#RRGGBB"
          maxLength={7}
          className="block w-full bg-transparent font-mono text-xs text-gray-200 placeholder-gray-600 outline-none"
        />
      </div>
      {value && (
        <button type="button" onClick={() => onChange("")} className="text-gray-500 hover:text-white"><X size={14} /></button>
      )}
    </div>
  );
}

const isEmpty = (v) => (Array.isArray(v) ? !v.length : !String(v ?? "").trim());
/** Mezcla lo que devolvió la IA sin pisar lo que el usuario ya escribió. */
function mergeAi(form, ai) {
  const fill = (cur = {}, add = {}) => ({ ...add, ...Object.fromEntries(Object.entries(cur).filter(([, v]) => !isEmpty(v))) });
  const social = fill(form.profile.social_handles, ai.profile?.social_handles);
  const profile = fill(form.profile, ai.profile);
  if (Object.keys(social).length) profile.social_handles = social;
  const logos = form.logos.length ? form.logos : (ai.logos || []).slice(0, 10);
  return { ...form, name: form.name.trim() ? form.name : ai.name || "", logos, colors: fill(form.colors, ai.colors), profile };
}

function AiFill({ ui, onResult }) {
  const fileRef = useRef(null);
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const run = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const site = /^https?:\/\//i.test(url.trim()) || !url.trim() ? url.trim() : `https://${url.trim()}`;
      const r = await autofillBrand({ url: site, notes: notes.trim(), images });
      if (!r?.data) throw new Error(r?.message || `Unexpected response: ${JSON.stringify(r).slice(0, 200)}`);
      onResult(r.data, site);
      setMsg({ ok: true, text: `${ui.aiDone(r.tokens_charged)} ${ui.aiOnlyEmpty}` });
    } catch (err) {
      setMsg({ ok: false, text: /402/.test(err.message) ? ui.aiNoTokens : err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-3 rounded-2xl border border-[#DC569D]/30 bg-[#DC569D]/5 p-4">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-white"><Sparkles size={16} className="text-[#DC569D]" />{ui.aiTitle}</h4>
      <p className="text-xs text-gray-400">{ui.aiHint}</p>
      <div>
        <Mono>{ui.aiUrl}</Mono>
        <input type="text" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" className={`${INPUT} mt-1`} />
      </div>
      <div>
        <Mono>{ui.aiNotes}</Mono>
        <textarea rows={2} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} className={`${INPUT} mt-1 resize-none`} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {images.map((f, idx) => (
          <div key={f.name + idx} className="relative">
            {f.type === "application/pdf"
              ? <div title={f.name} className="h-14 w-14 rounded-lg ring-1 ring-white/15 flex flex-col items-center justify-center text-white/70"><FileText size={18} /><span className="text-[9px]">PDF</span></div>
              : <img src={URL.createObjectURL(f)} alt="" className="h-14 w-14 rounded-lg object-cover ring-1 ring-white/15" />}
            <button type="button" onClick={() => setImages((a) => a.filter((_, j) => j !== idx))} className="absolute -top-2 -right-2 rounded-full bg-[#DC569D] p-1"><X size={10} className="text-white" /></button>
          </div>
        ))}
        <input ref={fileRef} type="file" multiple accept="image/png,image/jpeg,image/webp,application/pdf" hidden onChange={(e) => { setImages((a) => [...a, ...Array.from(e.target.files || [])].slice(0, 4)); e.target.value = ""; }} />
        <button type="button" disabled={busy || images.length >= 4} onClick={() => fileRef.current?.click()} className={BTN_SECONDARY} title={ui.aiMax}>
          <Plus className="h-4 w-4 inline" /> {ui.aiImages}
        </button>
        <button type="button" disabled={busy || (!url.trim() && !notes.trim() && !images.length)} onClick={run} className={`${BTN_PRIMARY} ml-auto`}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {busy ? ui.aiRunning : ui.aiRun}
        </button>
      </div>
      {msg && <p className={`text-xs ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</p>}
    </section>
  );
}

function Field({ field, lang, value, onChange }) {
  return (
    <div>
      <Mono>{field[lang]}</Mono>
      {field.type === "list" && <ListField value={value} onChange={onChange} placeholder={field.hint} />}
      {field.type === "area" && <textarea rows={3} value={value || ""} onChange={(e) => onChange(e.target.value)} className={`${INPUT} mt-1 resize-none`} />}
      {field.type === "text" && <input value={value || ""} onChange={(e) => onChange(e.target.value)} className={`${INPUT} mt-1`} />}
      {field.type === "select" && (
        <div className="mt-1 flex gap-2 flex-wrap">
          {["", ...field.options].map((o) => (
            <button
              type="button"
              key={o || "none"}
              onClick={() => onChange(o)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${(value || "") === o ? "bg-[#DC569D] text-white" : "bg-[#2f2f2f] text-gray-400 hover:bg-[#3a3a3a] hover:text-white"}`}
            >
              {o ? (OPTION_LABELS[o]?.[lang === "es" ? 1 : 0] ?? o) : "—"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Quita vacíos para no mandar ruido (y no gastar tokens del agente con campos en blanco). */
function cleanPayload(form) {
  const profile = {};
  Object.entries(form.profile).forEach(([k, v]) => {
    if (k === "social_handles") {
      const s = Object.fromEntries(Object.entries(v || {}).filter(([, h]) => h?.trim()));
      if (Object.keys(s).length) profile[k] = s;
    } else if (Array.isArray(v) ? v.length : v?.trim()) profile[k] = v;
  });
  const { extra = [], ...main } = form.colors;
  const colors = Object.fromEntries(Object.entries(main).filter(([, v]) => HEX.test(v)));
  const validExtra = extra.filter((c) => HEX.test(c));
  if (validExtra.length) colors.extra = validExtra;
  return { name: form.name.trim(), logos: form.logos, colors, profile };
}

export default function BrandForm({ brand, onClose, onSaved }) {
  const { locale } = useI18n();
  const lang = locale === "es" ? "es" : "en";
  const i = lang === "es" ? 1 : 0;
  const ui = UI[lang];
  const fileRef = useRef(null);
  const [logoKind, setLogoKind] = useState("primary");
  const [form, setForm] = useState({
    name: brand?.name || "",
    logos: brand?.logos || [],
    colors: brand?.colors || {},
    profile: brand?.profile || {},
  });
  const [fillKey, setFillKey] = useState(0); // remonta campos con estado interno (listas) tras rellenar con IA
  const applyAi = (ai, url) => {
    setForm((f) => mergeAi(f, { ...ai, profile: { website: url || undefined, ...ai.profile } }));
    setFillKey((k) => k + 1);
  };
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const setColor = (k) => (v) => setForm((f) => ({ ...f, colors: { ...f.colors, [k]: v } }));
  const setProfile = (k) => (v) => setForm((f) => ({ ...f, profile: { ...f.profile, [k]: v } }));
  const setSocial = (k) => (e) => setProfile("social_handles")({ ...form.profile.social_handles, [k]: e.target.value });

  const addLogo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      setForm((f) => ({ ...f, logos: [...f.logos, { kind: logoKind, url }] }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload = cleanPayload(form);
      onSaved(brand ? await updateBrand(brand.id, payload) : await createBrand(payload));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal onClose={() => !busy && onClose()} wide dismissable={false}>
      <form onSubmit={submit} className="space-y-6">
        <h3 className="text-xl font-semibold text-white">{brand ? ui.edit : ui.new}</h3>

        <div>
          <Mono>{ui.name}</Mono>
          <input autoFocus required maxLength={120} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={`${INPUT} mt-1`} />
        </div>

        <AiFill ui={ui} onResult={applyAi} />

        <div key={fillKey} className="space-y-6">
        <section className="space-y-3">
          <h4 className="text-sm font-semibold text-white">{ui.logos}</h4>
          <p className="text-xs text-gray-500">{ui.logoHint}</p>
          <div className="flex flex-wrap gap-3">
            {form.logos.map((l, idx) => (
              <div key={l.url + idx} className="relative bg-[#2f2f2f] rounded-lg p-2 w-24">
                <img src={l.url} alt={l.kind} className="h-14 w-full object-contain" />
                <Mono className="block text-center mt-1">{LOGO_LABELS[l.kind][i]}</Mono>
                <button type="button" onClick={() => setForm((f) => ({ ...f, logos: f.logos.filter((_, j) => j !== idx) }))} className="absolute -top-2 -right-2 bg-[#DC569D] rounded-full p-1">
                  <Trash2 size={10} className="text-white" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            {LOGO_KINDS.map((k) => (
              <button
                type="button"
                key={k}
                onClick={() => setLogoKind(k)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${logoKind === k ? "bg-[#DC569D] text-white" : "bg-[#2f2f2f] text-gray-400 hover:bg-[#3a3a3a] hover:text-white"}`}
              >
                {LOGO_LABELS[k][i]}
              </button>
            ))}
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={addLogo} />
            <button type="button" disabled={uploading || form.logos.length >= 10} onClick={() => fileRef.current?.click()} className={BTN_SECONDARY}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin inline" /> : <Plus className="h-4 w-4 inline" />} {uploading ? ui.uploading : ui.addLogo}
            </button>
          </div>
        </section>

        <section className="space-y-3">
          <h4 className="text-sm font-semibold text-white">{ui.colors}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {COLOR_KEYS.map((k) => (
              <ColorField key={k} label={COLOR_LABELS[k][i]} value={form.colors[k]} onChange={setColor(k)} />
            ))}
          </div>
          <div>
            <Mono>{ui.extraColors}</Mono>
            <ListField value={form.colors.extra} onChange={setColor("extra")} placeholder="#FFAA00, #00AAFF" />
          </div>
        </section>

        <section className="space-y-3">
          <h4 className="text-sm font-semibold text-white">{ui.social}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SOCIALS.map((s) => (
              <div key={s}>
                <Mono>{s}</Mono>
                <input value={form.profile.social_handles?.[s] || ""} onChange={setSocial(s)} placeholder="@" className={`${INPUT} mt-1`} />
              </div>
            ))}
          </div>
        </section>

        {SECTIONS.map((s) => (
          <section key={s.id} className="space-y-3">
            <h4 className="text-sm font-semibold text-white">{s[lang]}</h4>
            {s.fields.map((field) => (
              <Field key={field.key} field={field} lang={lang} value={form.profile[field.key]} onChange={setProfile(field.key)} />
            ))}
          </section>
        ))}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-3 justify-end sticky bottom-0 bg-[#1a1a1a] pt-3">
          <button type="button" onClick={onClose} disabled={busy} className={BTN_SECONDARY}>{ui.cancel}</button>
          <button type="submit" disabled={busy || uploading || !form.name.trim()} className={BTN_PRIMARY}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {ui.save}
          </button>
        </div>
      </form>
    </Modal>
  );
}
