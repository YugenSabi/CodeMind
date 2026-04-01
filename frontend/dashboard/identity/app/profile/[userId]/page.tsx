import type { ReactNode } from 'react';
import { ProfileComponent } from '@fragments/profile';

export default function PublicProfilePage({
  params,
}: {
  params: { userId: string };
}): ReactNode {
  return <ProfileComponent userId={params.userId} />;
}
