'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { deleteRoom } from '@lib/rooms';
import { type OwnProfile, updateOwnProfile } from '@lib/users';
import { Button } from '@ui/button';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import { AvatarUploadField } from '../avatar-upload-field/component';
import { InlineMessage } from '../inline-message/component';
import { MetricCard } from '../metric-card/component';
import { ProfileAvatar } from '../profile-avatar/component';
import { ProfileCard } from '../profile-card/component';
import { ProfileField } from '../profile-field/component';
import { ProfileShell } from '../profile-shell/component';
import { RoomList } from '../room-list/component';
import { formatProfileDate, readFileAsDataUrl } from '../helpers';

type OwnProfileViewProps = {
  profile: OwnProfile;
  currentUserName: string | null;
  onProfileChange: (profile: OwnProfile) => void;
  onSessionProfileChange: (user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl?: string | null;
    isVerified: boolean;
    createdAt?: string;
  }) => void;
  onOpenRoom: (roomId: string) => void;
};

export function OwnProfileView({
  profile,
  currentUserName,
  onProfileChange,
  onSessionProfileChange,
  onOpenRoom,
}: OwnProfileViewProps): ReactNode {
  const t = useTranslations('profile');
  const [firstName, setFirstName] = useState(profile.firstName ?? '');
  const [lastName, setLastName] = useState(profile.lastName ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? '');
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);
  const [isReadingAvatar, setIsReadingAvatar] = useState(false);

  useEffect(() => {
    setFirstName(profile.firstName ?? '');
    setLastName(profile.lastName ?? '');
    setAvatarUrl(profile.avatarUrl ?? '');
  }, [profile.avatarUrl, profile.firstName, profile.lastName]);

  const availableRooms = Math.max(0, 2 - profile.ownedRooms.length);

  const handleSave = async () => {
    if (isSaving) {
      return;
    }

    try {
      setIsSaving(true);
      setFormMessage(null);

      const updatedProfile = await updateOwnProfile({
        firstName,
        lastName,
        avatarUrl,
      });

      onProfileChange(updatedProfile);
      onSessionProfileChange({
        id: updatedProfile.id,
        email: updatedProfile.email,
        firstName: updatedProfile.firstName,
        lastName: updatedProfile.lastName,
        avatarUrl: updatedProfile.avatarUrl,
        isVerified: updatedProfile.isVerified,
        createdAt: updatedProfile.createdAt,
      });
      setFormMessage(t('messages.updated'));
    } catch (error) {
      setFormMessage(
        error instanceof Error ? error.message : t('messages.updateFailed'),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File | null) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setFormMessage(t('messages.imageOnly'));
      return;
    }

    if (file.size > 350_000) {
      setFormMessage(t('messages.avatarTooLarge'));
      return;
    }

    try {
      setIsReadingAvatar(true);
      setFormMessage(null);
      const nextAvatarUrl = await readFileAsDataUrl(file);
      setAvatarUrl(nextAvatarUrl);
      setFormMessage(t('messages.imageLoaded'));
    } catch {
      setFormMessage(t('messages.imageReadFailed'));
    } finally {
      setIsReadingAvatar(false);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (deletingRoomId) {
      return;
    }

    try {
      setDeletingRoomId(roomId);
      setFormMessage(null);

      await deleteRoom(roomId);
      onProfileChange({
        ...profile,
        ownedRooms: profile.ownedRooms.filter((room) => room.id !== roomId),
      });
    } catch (error) {
      setFormMessage(
        error instanceof Error ? error.message : t('messages.deleteRoomFailed'),
      );
    } finally {
      setDeletingRoomId(null);
    }
  };

  return (
    <ProfileShell
      title={currentUserName ?? t('own.defaultTitle')}
      subtitle={t('own.subtitle')}
      sideCard={
        <Box flexDirection="column" gap={12}>
          <ProfileAvatar
            name={currentUserName ?? profile.email}
            avatarUrl={avatarUrl || profile.avatarUrl}
            size={265}
          />
          <MetricCard
            label={t('common.registrationDate')}
            value={formatProfileDate(profile.createdAt)}
          />
          <MetricCard
            label={t('common.rooms')}
            value={`${profile.ownedRooms.length} / 2`}
          />
          <MetricCard
            label={t('common.remainingRooms')}
            value={`${availableRooms}`}
          />
        </Box>
      }
    >
      <ProfileCard title={t('own.title')} subtitle={t('own.subtitleForm')}>
        <Box flexDirection="column" gap={12}>
          <ProfileField
            label={t('own.firstNameLabel')}
            value={firstName}
            onChange={setFirstName}
            placeholder={t('own.firstNamePlaceholder')}
          />
          <ProfileField
            label={t('own.lastNameLabel')}
            value={lastName}
            onChange={setLastName}
            placeholder={t('own.lastNamePlaceholder')}
          />
          <AvatarUploadField
            avatarUrl={avatarUrl}
            isLoading={isReadingAvatar}
            onFileChange={(file) => {
              void handleAvatarUpload(file);
            }}
            onRemove={() => {
              setAvatarUrl('');
              setFormMessage(t('messages.avatarPendingRemoval'));
            }}
          />
          <Box justifyContent="space-between" alignItems="center" gap={10}>
            <Text color="#7D8793" font="$footer" size={12} lineHeight="16px">
              Email: {profile.email}
            </Text>
            <Button
              type="button"
              variant="filled"
              height={42}
              padding={18}
              borderRadius={12}
              bg="#43953D"
              textColor="#FFFFFF"
              disabled={isSaving}
              onClick={() => {
                void handleSave();
              }}
            >
              <Text color="#FFFFFF" font="$footer" size={14} lineHeight="18px">
                {isSaving ? t('own.saving') : t('own.save')}
              </Text>
            </Button>
          </Box>
          {formMessage ? <InlineMessage message={formMessage} /> : null}
        </Box>
      </ProfileCard>

      <ProfileCard title={t('own.roomsTitle')} subtitle={t('own.roomsSubtitle')}>
        <RoomList
          rooms={profile.ownedRooms}
          emptyMessage={t('own.emptyRooms')}
          deletingRoomId={deletingRoomId}
          onOpenRoom={onOpenRoom}
          onDeleteRoom={(roomId) => {
            void handleDeleteRoom(roomId);
          }}
        />
      </ProfileCard>
    </ProfileShell>
  );
}
