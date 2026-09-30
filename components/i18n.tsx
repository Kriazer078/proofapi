"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { LOCALES, LOCALE_NAMES, type Locale, MESSAGES } from "@/lib/i18n/messages";

const LocaleContext = createContext<Locale>("en");

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useI18n() {
  const locale = useContext(LocaleContext);
  return { locale, t: MESSAGES[locale] };
}

const SHORT: Record<Locale, string> = { en: "EN", ru: "RU", kk: "KZ" };

export function LanguageSwitcher() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  function choose(next: Locale) {
    document.cookie = `lang=${next}; path=/; max-age=31536000; samesite=lax`;
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="relative" ref={box}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t.nav.language}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line-strong px-2.5 text-xs font-medium text-muted transition-colors hover:text-fg"
      >
        <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" />
        </svg>
        {SHORT[locale]}
      </button>
      {open && (
        <ul role="listbox" aria-label={t.nav.language} className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-xl border border-line-strong bg-panel-2 p-1 shadow-2xl shadow-black/50">
          {LOCALES.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={l === locale}
                onClick={() => choose(l)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/[0.06] ${l === locale ? "text-fg" : "text-muted"}`}
              >
                {LOCALE_NAMES[l]}
                {l === locale && <span className="size-1.5 rounded-full bg-sol-green" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
