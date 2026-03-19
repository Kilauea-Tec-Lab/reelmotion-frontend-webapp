import React from "react";
import { useI18n } from "./i18n-context";

export default function LanguageSelector() {
  const { locale, setLocale } = useI18n();

  const toggle = () => {
    setLocale(locale === "en" ? "es" : "en");
  };

  return (
    <button
      onClick={toggle}
      className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm text-white transition-colors"
      aria-label="Toggle language"
    >
      {locale === "en" ? "\u{1F1FA}\u{1F1F8} EN" : "\u{1F1EA}\u{1F1F8} ES"}
    </button>
  );
}
