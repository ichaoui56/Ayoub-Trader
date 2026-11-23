"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { translate, type Locale } from "../i18n";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (phrase: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children, initialLocale }: { children: ReactNode; initialLocale: Locale }) {
  const router = useRouter();
  const [locale, setCurrentLocale] = useState(initialLocale);

  useEffect(() => {
    const saved = document.cookie.split(";").map((item) => item.trim()).find((item) => item.startsWith("morocco-locale="))?.split("=")[1];
    if (saved === "fr" || saved === "ar" || saved === "en") setCurrentLocale(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  function setLocale(nextLocale: Locale) {
    setCurrentLocale(nextLocale);
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `morocco-locale=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
    document.documentElement.lang = nextLocale;
    router.refresh();
  }

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    setLocale,
    t: (phrase) => translate(locale, phrase),
  }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used inside LocaleProvider.");
  return context;
}
