import { Suspense, type ReactNode } from 'react';
import { AuthFlowComponent } from '@fragments/auth-flow';

export default function RegistrationPage(): ReactNode {
  return (
    <Suspense fallback={null}>
      <AuthFlowComponent flowType="registration" />
    </Suspense>
  );
}
