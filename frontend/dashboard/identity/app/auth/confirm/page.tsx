import { Suspense, type ReactNode } from 'react';
import { AuthFlowComponent } from '@fragments/auth-flow';

export default function ConfirmPage(): ReactNode {
  return (
    <Suspense fallback={null}>
      <AuthFlowComponent flowType="verification" />
    </Suspense>
  );
}
