'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getDisplayName, useAuthSession } from '@lib/auth';
import {
  getOwnProfile,
  getPublicProfile,
  type OwnProfile,
  type PublicProfile,
} from '@lib/users';
import { OwnProfileView } from './own-profile-view/component';
import { PublicProfileView } from './public-profile-view/component';
import { StateCard } from './state-card/component';

type ProfileComponentProps = {
  userId?: string;
};

export function ProfileComponent({
  userId,
}: ProfileComponentProps): ReactNode {
  const t = useTranslations('profile');
  const router = useRouter();
  const {
    user,
    requiresVerification,
    verificationMessage,
    updateSessionUser,
  } = useAuthSession();
  const isOwnProfile = !userId || userId === user?.id;
  const [profile, setProfile] = useState<OwnProfile | PublicProfile | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const nextProfile = isOwnProfile
          ? await getOwnProfile()
          : await getPublicProfile(userId);

        if (!cancelled) {
          setProfile(nextProfile);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : t('state.loadFailed'),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    if (!userId && !user && !requiresVerification) {
      setIsLoading(false);
      setErrorMessage(t('state.signInFirst'));
      return;
    }

    if (!isOwnProfile && !userId) {
      setIsLoading(false);
      setErrorMessage(t('state.notFound'));
      return;
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [isOwnProfile, requiresVerification, t, user, userId]);

  if (requiresVerification && isOwnProfile) {
    return (
      <StateCard
        title={t('state.verifyTitle')}
        description={verificationMessage ?? t('state.verifyDescription')}
      />
    );
  }

  if (isLoading) {
    return (
      <StateCard
        title={t('state.loadingTitle')}
        description={t('state.loadingDescription')}
      />
    );
  }

  if (errorMessage || !profile) {
    return (
      <StateCard
        title={t('state.errorTitle')}
        description={errorMessage ?? t('state.errorDescription')}
      />
    );
  }

  return isOwnProfile ? (
    <OwnProfileView
      profile={profile as OwnProfile}
      currentUserName={user ? getDisplayName(user) : null}
      onProfileChange={setProfile}
      onSessionProfileChange={updateSessionUser}
      onOpenRoom={(roomId) => {
        router.push(`/room/${roomId}`);
      }}
    />
  ) : (
    <PublicProfileView
      profile={profile as PublicProfile}
      onOpenRoom={(roomId) => {
        router.push(`/room/${roomId}`);
      }}
    />
  );
}
