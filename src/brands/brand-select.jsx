import { useEffect, useState } from "react";
import { useI18n } from "../i18n/i18n-context";
import { INPUT } from "../studio/components/tokens";
import { listBrands } from "./functions";

/** <select> de marcas para formularios (Studio). value/onChange usan uuid o "" = sin marca. */
export default function BrandSelect({ value, onChange }) {
  const { t } = useI18n();
  const [brands, setBrands] = useState([]);
  useEffect(() => {
    listBrands().then(setBrands).catch(() => {});
  }, []);
  if (brands.length === 0) return null;
  return (
    <select value={value || ""} onChange={(e) => onChange(e.target.value || null)} className={`${INPUT} mt-1`}>
      <option value="">{t("brands.picker.none")}</option>
      {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
    </select>
  );
}
