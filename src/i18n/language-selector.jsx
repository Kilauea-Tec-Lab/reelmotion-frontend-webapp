import React from "react";
import { useI18n } from "./i18n-context";

export default function LanguageSelector() {
  const { locale, setLocale } = useI18n();

  const toggle = () => {
    setLocale(locale === "en" ? "es" : "en");
  };

  const isEn = locale === "en";

  return (
    <button
      onClick={toggle}
      className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm text-white transition-colors flex items-center gap-1.5"
      aria-label="Toggle language"
    >
      <img
        src={isEn ? "https://flagcdn.com/w20/us.png" : "https://flagcdn.com/w20/es.png"}
        width="20"
        alt={isEn ? "US" : "ES"}
        className="rounded-sm"
      />
      {isEn ? "EN" : "ES"}
    </button>
  );
}
