'use client';

import { type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import type { PublicProfile } from '@lib/users';
import { Box } from '@ui/layout';
import { MetricCard } from '../metric-card/component';
import { ProfileAvatar } from '../profile-avatar/component';
import { ProfileCard } from '../profile-card/component';
import { ProfileShell } from '../profile-shell/component';
import { RoomList } from '../room-list/component';
import { formatProfileDate, getProfileName } from '../helpers';

type PublicProfileViewProps = {
  profile: PublicProfile;
  onOpenRoom: (roomId: string) => void;
};

export function PublicProfileView({
  profile,
  onOpenRoom,
}: PublicProfileViewProps): ReactNode {
  const t = useTranslations('profile');
  const displayName = getProfileName(profile, t('common.fallbackUser'));

  return (
    <ProfileShell
      title={displayName}
      subtitle={t('public.subtitle')}
      sideCard={
        <Box flexDirection="column" gap={12}>
          <ProfileAvatar
            name={displayName}
            avatarUrl={profile.avatarUrl}
            size={265}
          />
          <MetricCard
            label={t('common.registrationDate')}
            value={formatProfileDate(profile.createdAt)}
          />
          <MetricCard
            label={t('common.rooms')}
            value={`${profile.stats.roomsCount}`}
          />
          <MetricCard
            label={t('public.algorithmRooms')}
            value={`${profile.stats.algorithmRoomsCount}`}
          />
        </Box>
      }
    >
      <ProfileCard
        title={t('public.roomsTitle')}
        subtitle={t('public.roomsSubtitle')}
      >
        <RoomList
          rooms={profile.rooms}
          emptyMessage={t('public.emptyRooms')}
          deletingRoomId={null}
          onOpenRoom={onOpenRoom}
        />
      </ProfileCard>
    </ProfileShell>
  );
}
