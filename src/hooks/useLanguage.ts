"use client";
import React, { createContext, useContext, useMemo, useState } from "react";

export type Language = "es" | "en";

type LanguageCtx = {
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (l: Language) => void;
};

const LanguageContext = createContext<LanguageCtx | undefined>(undefined);

export function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [language, setLanguage] = useState<Language>("es");
  const toggleLanguage = () =>
    setLanguage((prev) => (prev === "es" ? "en" : "es"));
  const value: LanguageCtx = useMemo(
    () => ({ language, toggleLanguage, setLanguage }),
    [language]
  );
  return React.createElement(LanguageContext.Provider, { value }, children);
}

export function useLanguage(): LanguageCtx {
  const ctx = useContext(LanguageContext);
  // Declarar el estado de fallback siempre para respetar las reglas de los Hooks
  const [fallbackLanguage, setFallbackLanguage] = useState<Language>("es");
  const toggleFallback = () =>
    setFallbackLanguage((prev) => (prev === "es" ? "en" : "es"));
  if (!ctx) {
    // Fallback seguro si no se usa Provider (estado local aislado)
    return {
      language: fallbackLanguage,
      toggleLanguage: toggleFallback,
      setLanguage: setFallbackLanguage,
    };
  }
  return ctx;
}
