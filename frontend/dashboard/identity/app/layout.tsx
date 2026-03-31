import type { ReactNode } from 'react';
import { defaultLocale } from '@lib/i18n';
import { MainLayoutComponent } from '@fragments/layout';
import { GeologicaFont, delaGothicFont, underratedFont } from '@ui/theme';
import ruMessages from '../lib/i18n/locales/ru.json';
import Providers from './providers';
import './globals.css';

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang={defaultLocale}>
      <body
        className={`${delaGothicFont.variable} ${underratedFont.variable} ${GeologicaFont.variable}`}
      >
        <Providers locale={defaultLocale} messages={ruMessages}>
          <MainLayoutComponent>{children}</MainLayoutComponent>
        </Providers>
      </body>
    </html>
  );
}
