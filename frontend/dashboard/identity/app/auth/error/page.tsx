import { Suspense, type ReactNode } from 'react';
import { AuthErrorComponent } from '@fragments/auth-error';

export default function AuthErrorPage(): ReactNode {
  return (
    <Suspense fallback={null}>
      <AuthErrorComponent />
    </Suspense>
  );
}
