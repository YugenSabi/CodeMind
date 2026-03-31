import { Suspense, type ReactNode } from 'react';
import { AuthFlowComponent } from '@fragments/auth-flow';

export default function LoginPage(): ReactNode {
  return (
    <Suspense fallback={null}>
      <AuthFlowComponent flowType="login" />
    </Suspense>
  );
}
