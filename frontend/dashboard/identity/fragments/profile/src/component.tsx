'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDisplayName, useAuthSession } from '@lib/auth';
import { deleteRoom } from '@lib/rooms';
import {
  getOwnProfile,
  getPublicProfile,
  updateOwnProfile,
  type OwnProfile,
  type ProfileRoomSummary,
  type PublicProfile,
} from '@lib/users';
import { Button } from '@ui/button';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';

type ProfileComponentProps = {
  userId?: string;
};

export function ProfileComponent({
  userId,
}: ProfileComponentProps): ReactNode {
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
            error instanceof Error
              ? error.message
              : 'Не удалось загрузить профиль.',
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
      setErrorMessage('Сначала войдите в аккаунт.');
      return;
    }

    if (!isOwnProfile && !userId) {
      setIsLoading(false);
      setErrorMessage('Профиль не найден.');
      return;
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [isOwnProfile, requiresVerification, user, userId]);

  if (requiresVerification && isOwnProfile) {
    return (
      <StateCard
        title="Подтвердите аккаунт"
        description={
          verificationMessage ??
          'Подтвердите почту, чтобы открыть профиль и управлять комнатами.'
        }
      />
    );
  }

  if (isLoading) {
    return (
      <StateCard
        title="Загружаем профиль"
        description="Получаем данные пользователя и комнат."
      />
    );
  }

  if (errorMessage || !profile) {
    return (
      <StateCard
        title="Не удалось открыть профиль"
        description={errorMessage ?? 'Профиль недоступен.'}
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

function OwnProfileView({
  profile,
  currentUserName,
  onProfileChange,
  onSessionProfileChange,
  onOpenRoom,
}: {
  profile: OwnProfile;
  currentUserName: string | null;
  onProfileChange: (profile: OwnProfile) => void;
  onSessionProfileChange: ReturnType<typeof useAuthSession>['updateSessionUser'];
  onOpenRoom: (roomId: string) => void;
}) {
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
      setFormMessage('Профиль обновлён.');
    } catch (error) {
      setFormMessage(
        error instanceof Error
          ? error.message
          : 'Не удалось обновить профиль.',
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
      setFormMessage('Можно загрузить только изображение.');
      return;
    }

    if (file.size > 350_000) {
      setFormMessage('Аватарка должна быть меньше 350 КБ.');
      return;
    }

    try {
      setIsReadingAvatar(true);
      setFormMessage(null);
      const nextAvatarUrl = await readFileAsDataUrl(file);
      setAvatarUrl(nextAvatarUrl);
      setFormMessage('Изображение загружено. Сохраните профиль.');
    } catch {
      setFormMessage('Не удалось прочитать изображение.');
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
        error instanceof Error ? error.message : 'Не удалось удалить комнату.',
      );
    } finally {
      setDeletingRoomId(null);
    }
  };

  return (
    <ProfileShell
      title={currentUserName ?? 'Мой профиль'}
      subtitle="Личный кабинет, аватар и ваши комнаты"
      sideCard={
        <Box flexDirection="column" gap={12}>
          <ProfileAvatar
            name={currentUserName ?? profile.email}
            avatarUrl={avatarUrl || profile.avatarUrl}
            size={128}
          />
          <MetricCard
            label="Дата регистрации"
            value={formatProfileDate(profile.createdAt)}
          />
          <MetricCard
            label="Комнаты"
            value={`${profile.ownedRooms.length} / 2`}
          />
          <MetricCard
            label="Можно создать ещё"
            value={`${availableRooms}`}
          />
        </Box>
      }
    >
      <Card title="Данные профиля" subtitle="Изменения сразу применяются в комнате и публичном профиле.">
        <Box flexDirection="column" gap={12}>
          <ProfileField
            label="Имя"
            value={firstName}
            onChange={setFirstName}
            placeholder="Например, Иван"
          />
          <ProfileField
            label="Фамилия"
            value={lastName}
            onChange={setLastName}
            placeholder="Например, Петров"
          />
          <AvatarUploadField
            avatarUrl={avatarUrl}
            isLoading={isReadingAvatar}
            onFileChange={(file) => {
              void handleAvatarUpload(file);
            }}
            onRemove={() => {
              setAvatarUrl('');
              setFormMessage('Аватар будет удалён после сохранения.');
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
                {isSaving ? 'Сохраняем...' : 'Сохранить'}
              </Text>
            </Button>
          </Box>
          {formMessage ? <InlineMessage message={formMessage} /> : null}
        </Box>
      </Card>

      <Card
        title="Мои комнаты"
        subtitle="Удаление доступно только владельцу. На один аккаунт можно держать максимум две комнаты."
      >
        <RoomList
          rooms={profile.ownedRooms}
          emptyMessage="У вас пока нет комнат."
          deletingRoomId={deletingRoomId}
          onOpenRoom={onOpenRoom}
          onDeleteRoom={(roomId) => {
            void handleDeleteRoom(roomId);
          }}
        />
      </Card>
    </ProfileShell>
  );
}

function PublicProfileView({
  profile,
  onOpenRoom,
}: {
  profile: PublicProfile;
  onOpenRoom: (roomId: string) => void;
}) {
  const displayName = getProfileName(profile);

  return (
    <ProfileShell
      title={displayName}
      subtitle="Публичный профиль участника CodeMind"
      sideCard={
        <Box flexDirection="column" gap={12}>
          <ProfileAvatar
            name={displayName}
            avatarUrl={profile.avatarUrl}
            size={128}
          />
          <MetricCard
            label="Дата регистрации"
            value={formatProfileDate(profile.createdAt)}
          />
          <MetricCard
            label="Комнаты"
            value={`${profile.stats.roomsCount}`}
          />
          <MetricCard
            label="Algorithm rooms"
            value={`${profile.stats.algorithmRoomsCount}`}
          />
        </Box>
      }
    >
      <Card
        title="Публичные комнаты"
        subtitle="Здесь видны комнаты, которые пользователь создал в системе."
      >
        <RoomList
          rooms={profile.rooms}
          emptyMessage="У пользователя пока нет комнат."
          deletingRoomId={null}
          onOpenRoom={onOpenRoom}
        />
      </Card>
    </ProfileShell>
  );
}

function ProfileShell({
  title,
  subtitle,
  sideCard,
  children,
}: {
  title: string;
  subtitle: string;
  sideCard: ReactNode;
  children: ReactNode;
}) {
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
        <Card title={title} subtitle={subtitle}>
          {sideCard}
        </Card>
      </Box>

      <Box width="$full" flexDirection="column" gap={20}>
        {children}
      </Box>
    </Box>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <Box
      width="$full"
      backgroundColor="$cardBg"
      border="1px solid"
      borderColor="$border"
      borderRadius={26}
      padding={24}
      flexDirection="column"
      gap={18}
    >
      <Box flexDirection="column" gap={6}>
        <Text color="#FFFFFF" font="$rus" size={28} lineHeight="32px">
          {title}
        </Text>
        <Text color="#7D8793" font="$footer" size={14} lineHeight="20px">
          {subtitle}
        </Text>
      </Box>
      {children}
    </Box>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Box
      flexDirection="column"
      gap={6}
      padding={14}
      backgroundColor="#141922"
      border="1px solid"
      borderColor="rgba(255,255,255,0.06)"
      borderRadius={16}
    >
      <Text color="#7D8793" font="$footer" size={12} lineHeight="16px">
        {label}
      </Text>
      <Text color="#FFFFFF" font="$footer" size={18} lineHeight="22px">
        {value}
      </Text>
    </Box>
  );
}

function ProfileField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <Box flexDirection="column" gap={8}>
      <Text color="#D7DEE7" font="$footer" size={12} lineHeight="16px">
        {label}
      </Text>
      <input
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        placeholder={placeholder}
        style={fieldStyles}
      />
    </Box>
  );
}

function AvatarUploadField({
  avatarUrl,
  isLoading,
  onFileChange,
  onRemove,
}: {
  avatarUrl: string;
  isLoading: boolean;
  onFileChange: (file: File | null) => void;
  onRemove: () => void;
}) {
  return (
    <Box flexDirection="column" gap={8}>
      <Text color="#D7DEE7" font="$footer" size={12} lineHeight="16px">
        Аватарка
      </Text>
      <Box
        flexDirection="column"
        gap={12}
        padding={14}
        border="1px solid"
        borderColor="rgba(255,255,255,0.08)"
        borderRadius={16}
        backgroundColor="#0F141C"
      >
        <Text color="#7D8793" font="$footer" size={12} lineHeight="18px">
          Выберите изображение. Оно загрузится в профиль и будет видно в комнате и публичном профиле.
        </Text>
        <Box alignItems="center" gap={10}>
          <label style={{ display: 'inline-flex' }}>
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(event) => {
                onFileChange(event.target.files?.[0] ?? null);
                event.currentTarget.value = '';
              }}
            />
            <Box
              as="div"
              alignItems="center"
              justifyContent="center"
              height={42}
              paddingLeft={16}
              paddingRight={16}
              borderRadius={12}
              backgroundColor="#202734"
              border="1px solid"
              borderColor="rgba(255,255,255,0.08)"
              style={{ cursor: 'pointer' }}
            >
              <Text color="#FFFFFF" font="$footer" size={14} lineHeight="18px">
                {isLoading ? 'Загрузка...' : 'Загрузить файл'}
              </Text>
            </Box>
          </label>
          <Button
            type="button"
            variant="ghost"
            height={42}
            padding={16}
            border="1px solid"
            borderColor="rgba(209,67,67,0.35)"
            borderRadius={12}
            textColor="#D89A9A"
            bg="transparent"
            onClick={onRemove}
          >
            <Text color="#D89A9A" font="$footer" size={14} lineHeight="18px">
              Убрать
            </Text>
          </Button>
        </Box>
        {avatarUrl ? (
          <Text color="#7BC77A" font="$footer" size={12} lineHeight="16px">
            Новая аватарка подготовлена. Нажмите «Сохранить».
          </Text>
        ) : null}
      </Box>
    </Box>
  );
}

function RoomList({
  rooms,
  emptyMessage,
  deletingRoomId,
  onOpenRoom,
  onDeleteRoom,
}: {
  rooms: ProfileRoomSummary[];
  emptyMessage: string;
  deletingRoomId: string | null;
  onOpenRoom: (roomId: string) => void;
  onDeleteRoom?: (roomId: string) => void;
}) {
  if (rooms.length === 0) {
    return (
      <Text color="#7D8793" font="$footer" size={14} lineHeight="18px">
        {emptyMessage}
      </Text>
    );
  }

  return (
    <Box flexDirection="column" gap={12}>
      {rooms.map((room) => (
        <Box
          key={room.id}
          width="$full"
          backgroundColor="#141922"
          border="1px solid"
          borderColor="rgba(255,255,255,0.06)"
          borderRadius={16}
          padding={16}
          justifyContent="space-between"
          alignItems="center"
          gap={14}
        >
          <Box flexDirection="column" gap={6}>
            <Text color="#FFFFFF" font="$footer" size={16} lineHeight="20px">
              {room.name}
            </Text>
            <Text color="#7D8793" font="$footer" size={12} lineHeight="16px">
              {getRoomModeLabel(room.mode)} · участников {room.membersCount} · файлов {room.filesCount}
            </Text>
            <Text color="#5B6470" font="$footer" size={12} lineHeight="16px">
              Создана {formatProfileDate(room.createdAt)}
            </Text>
          </Box>

          <Box alignItems="center" gap={10}>
            <Button
              type="button"
              variant="ghost"
              height={38}
              padding={16}
              border="1px solid"
              borderColor="rgba(255,255,255,0.08)"
              borderRadius={10}
              textColor="#FFFFFF"
              bg="transparent"
              onClick={() => {
                onOpenRoom(room.id);
              }}
            >
              <Text color="#FFFFFF" font="$footer" size={13} lineHeight="16px">
                Открыть
              </Text>
            </Button>
            {onDeleteRoom ? (
              <Button
                type="button"
                variant="ghost"
                height={38}
                padding={16}
                border="1px solid"
                borderColor="rgba(209,67,67,0.35)"
                borderRadius={10}
                textColor="#D89A9A"
                bg="transparent"
                disabled={deletingRoomId === room.id}
                onClick={() => {
                  onDeleteRoom(room.id);
                }}
              >
                <Text color="#D89A9A" font="$footer" size={13} lineHeight="16px">
                  {deletingRoomId === room.id ? 'Удаление...' : 'Удалить'}
                </Text>
              </Button>
            ) : null}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

function ProfileAvatar({
  name,
  avatarUrl,
  size,
}: {
  name: string;
  avatarUrl?: string | null;
  size: number;
}) {
  const initials = useMemo(() => {
    const compact = name.trim();
    return compact.charAt(0).toUpperCase() || 'U';
  }, [name]);

  return (
    <Box
      width={size}
      height={size}
      borderRadius={28}
      backgroundColor="#141922"
      border="1px solid"
      borderColor="rgba(255,255,255,0.08)"
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <Text color="#FFFFFF" font="$rus" size={44} lineHeight="48px">
          {initials}
        </Text>
      )}
    </Box>
  );
}

function InlineMessage({ message }: { message: string }) {
  return (
    <Text color="#7BC77A" font="$footer" size={13} lineHeight="18px">
      {message}
    </Text>
  );
}

function StateCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Box
      width="$full"
      backgroundColor="$cardBg"
      border="1px solid"
      borderColor="$border"
      borderRadius={26}
      paddingTop={44}
      paddingRight={32}
      paddingBottom={44}
      paddingLeft={32}
      justifyContent="center"
      alignItems="center"
      flexDirection="column"
      gap={12}
    >
      <Text color="#FFFFFF" font="$rus" size={28} lineHeight="32px">
        {title}
      </Text>
      <Text
        color="#7D8793"
        font="$footer"
        size={15}
        lineHeight="22px"
        textAlign="center"
      >
        {description}
      </Text>
    </Box>
  );
}

function getProfileName(profile: {
  firstName: string | null;
  lastName: string | null;
}) {
  const fullName = [profile.firstName, profile.lastName]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(' ')
    .trim();

  return fullName || 'Пользователь CodeMind';
}

function formatProfileDate(date: string) {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getRoomModeLabel(mode: ProfileRoomSummary['mode']) {
  switch (mode) {
    case 'ALGORITHMS':
      return 'Алгоритмы';
    case 'INTERVIEWS':
      return 'Интервью';
    default:
      return 'Just coding';
  }
}

const fieldStyles = {
  width: '100%',
  height: 46,
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.08)',
  background: '#0F141C',
  color: '#FFFFFF',
  padding: '0 14px',
  outline: 'none',
  fontSize: '14px',
  lineHeight: '18px',
} as const;

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('File reading failed'));
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error('File reading failed'));
    };

    reader.readAsDataURL(file);
  });
}
