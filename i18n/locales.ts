export const LOCALES = ['en', 'es', 'ja', 'pt', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  ja: '日本語',
  pt: 'Português',
  ar: 'العربية',
};

export const RTL_LOCALES: Locale[] = ['ar'];
export const LANG_COOKIE = 'lang';
