import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { DEFAULT_LOCALE, LOCALES, LANG_COOKIE, type Locale } from './locales';

// Pick locale from cookie first, then Accept-Language, then default.
function resolveLocale(): Locale {
  const fromCookie = cookies().get(LANG_COOKIE)?.value;
  if (fromCookie && (LOCALES as readonly string[]).includes(fromCookie)) {
    return fromCookie as Locale;
  }
  const accept = headers().get('accept-language');
  if (accept) {
    for (const part of accept.split(',')) {
      const code = part.split(';')[0]!.trim().slice(0, 2).toLowerCase();
      if ((LOCALES as readonly string[]).includes(code)) return code as Locale;
    }
  }
  return DEFAULT_LOCALE;
}

export default getRequestConfig(async () => {
  const locale = resolveLocale();
  // Load JSON dynamically so locales not in use aren't bundled together.
  const messages = (await import(`../messages/${locale}.json`)).default;
  return { locale, messages };
});
