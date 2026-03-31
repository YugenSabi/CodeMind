import type { ReactNode } from 'react';
import localFont from 'next/font/local';
import { defaultLocale } from '@lib/i18n';
import ruMessages from '../lib/i18n/locales/ru.json';
import Providers from './providers';
import './globals.css';

const delaGothicFont = localFont({
  src: '../../../packages/ui/theme/src/fonts/DelaGothicOne-Regular.ttf',
  variable: '--ui-font-rus',
  display: 'swap',
});

const underratedFont = localFont({
  src: '../../../packages/ui/theme/src/fonts/UNDERRATED-UltraBold Personal Use.otf',
  variable: '--ui-font-eng',
  display: 'swap',
});

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang={defaultLocale}>
      <body className={`${delaGothicFont.variable} ${underratedFont.variable}`}>
        <Providers locale={defaultLocale} messages={ruMessages}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
