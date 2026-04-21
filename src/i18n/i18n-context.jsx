import React, { createContext, useContext, useState, useCallback } from "react";
import translations from "./translations";

const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    const saved = typeof localStorage !== "undefined" && localStorage.getItem("locale");
    if (saved === "en" || saved === "es") return saved;
    if (typeof navigator !== "undefined" && navigator.language) {
      return navigator.language.startsWith("es") ? "es" : "en";
    }
    return "en";
  });

  const setLocale = (lang) => {
    if (typeof localStorage !== "undefined") localStorage.setItem("locale", lang);
    setLocaleState(lang);
  };

  const t = useCallback(
    (key) => {
      if (translations[locale] && translations[locale][key] !== undefined) {
        return translations[locale][key];
      }
      if (translations.en && translations.en[key] !== undefined) {
        return translations.en[key];
      }
      return key;
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
