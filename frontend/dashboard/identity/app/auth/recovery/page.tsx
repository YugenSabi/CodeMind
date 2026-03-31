import { Suspense, type ReactNode } from 'react';
import { AuthFlowComponent } from '@fragments/auth-flow';

export default function RecoveryPage(): ReactNode {
  return (
    <Suspense fallback={null}>
      <AuthFlowComponent flowType="recovery" />
    </Suspense>
  );
}
