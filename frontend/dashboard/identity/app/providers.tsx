'use client';

import type { ReactNode } from 'react';
import type { AbstractIntlMessages } from 'next-intl';
import { NextIntlClientProvider } from 'next-intl';
import { AuthSessionProvider } from '@lib/auth';
import { ToastContainer, ToastProvider } from '@ui/toast';

type ProvidersProps = {
  children: ReactNode;
  locale: string;
  messages: AbstractIntlMessages;
};

export default function Providers({ children, locale, messages }: ProvidersProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      <AuthSessionProvider>
        <ToastProvider>
          {children}
          <ToastContainer />
        </ToastProvider>
      </AuthSessionProvider>
    </NextIntlClientProvider>
  );
}
