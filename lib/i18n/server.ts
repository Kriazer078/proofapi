import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, type Locale, MESSAGES, isLocale } from "./messages";

export const LOCALE_COOKIE = "lang";

/** Saved choice first, then the browser language, then English. */
export async function getLocale(): Promise<Locale> {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;
  const accept = (await headers()).get("accept-language")?.toLowerCase() ?? "";
  for (const part of accept.split(",")) {
    const code = part.trim().slice(0, 2);
    if (isLocale(code)) return code;
  }
  return DEFAULT_LOCALE;
}

export async function getMessages() {
  const locale = await getLocale();
  return { locale, t: MESSAGES[locale] };
}
