import React, { createContext, useContext, useState, useCallback } from "react";
import translations from "./translations";

const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    // English-first product: default to 'en' unless the user explicitly picked a
    // language (persisted via the toggle). No browser-language auto-detection.
    // `?lang=es` (the hreflang URL) wins over the persisted choice.
    const fromUrl = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("lang");
    const saved = fromUrl || (typeof localStorage !== "undefined" && localStorage.getItem("locale"));
    return saved === "en" || saved === "es" ? saved : "en";
  });

  const setLocale = (lang) => {
    if (typeof localStorage !== "undefined") localStorage.setItem("locale", lang);
    setLocaleState(lang);
  };

  const t = useCallback(
    (key, vars) => {
      const text = translations[locale]?.[key] ?? translations.en?.[key] ?? key;
      // "{max}" -> vars.max
      return vars ? text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m)) : text;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
