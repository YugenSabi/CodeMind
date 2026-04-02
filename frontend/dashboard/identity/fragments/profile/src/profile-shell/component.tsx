import { type ReactNode } from 'react';
import { Box } from '@ui/layout';
import { ProfileCard } from '../profile-card/component';

type ProfileShellProps = {
  title: string;
  subtitle: string;
  sideCard: ReactNode;
  children: ReactNode;
};

export function ProfileShell({
  title,
  subtitle,
  sideCard,
  children,
}: ProfileShellProps): ReactNode {
  return (
    <Box
      width="$full"
      gap={20}
      alignItems="flex-start"
      style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)' }}
    >
      <Box
        flexDirection="column"
        gap={16}
        width="$full"
        position="sticky"
        style={{ top: 0 }}
      >
        <ProfileCard title={title} subtitle={subtitle}>
          {sideCard}
        </ProfileCard>
      </Box>

      <Box width="$full" flexDirection="column" gap={20}>
        {children}
      </Box>
    </Box>
  );
}
