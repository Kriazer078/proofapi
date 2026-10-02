"use client";

import { Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, useContext } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LOCALES,
  LOCALE_NAMES,
  type Locale,
  MESSAGES,
} from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

const LocaleContext = createContext<Locale>("en");

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
}

export function useI18n() {
  const locale = useContext(LocaleContext);
  return { locale, t: MESSAGES[locale] };
}

const SHORT: Record<Locale, string> = { en: "EN", ru: "RU", kk: "KZ" };

/** Language menu. The choice is kept in a cookie for a year and applied on the server. */
export function LanguageSwitcher({
  className,
  contentClassName,
}: {
  className?: string;
  contentClassName?: string;
}) {
  const { locale, t } = useI18n();
  const router = useRouter();

  function choose(next: string) {
    document.cookie = `lang=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-slot="button"
        aria-label={t.nav.language}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
          className,
        )}
      >
        <Globe className="size-3.5" aria-hidden="true" />
        {SHORT[locale]}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={cn("min-w-40", contentClassName)}
      >
        <DropdownMenuRadioGroup
          value={locale}
          onValueChange={(v) => choose(String(v))}
        >
          {LOCALES.map((l) => (
            <DropdownMenuRadioItem key={l} value={l}>
              {LOCALE_NAMES[l]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
