import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import './globals.css';
import './design.css';
import { RTL_LOCALES, type Locale } from '@/i18n/locales';

export const metadata: Metadata = {
  title: 'Smoking — A field guide',
  description:
    'A field guide to places where you can still light up: smoke shops, terraces, courtyards, lookouts, kiosks, benches.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Smoking',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#B9421A',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // i18n: locale chosen by cookie / Accept-Language in i18n/request.ts
  const locale = (await getLocale()) as Locale;
  const messages = await getMessages();
  const dir = RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Space+Grotesk:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
