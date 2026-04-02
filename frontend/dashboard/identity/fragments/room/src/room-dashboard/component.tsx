'use client';

import { type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import type { RoomDashboardItem } from '@lib/rooms';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';

type RoomDashboardProps = {
  items: RoomDashboardItem[];
  isLoading: boolean;
  errorMessage: string | null;
};

export function RoomDashboard({
  items,
  isLoading,
  errorMessage,
}: RoomDashboardProps): ReactNode {
  const t = useTranslations('room.dashboard');

  if (isLoading) {
    return (
      <PanelState
        title={t('loadingTitle')}
        description={t('loadingDescription')}
      />
    );
  }

  if (errorMessage) {
    return (
      <PanelState
        title={t('unavailableTitle')}
        description={errorMessage}
        tone="error"
      />
    );
  }

  if (items.length === 0) {
    return (
      <PanelState
        title={t('emptyTitle')}
        description={t('emptyDescription')}
      />
    );
  }

  return (
    <Box
      width="$full"
      height="$full"
      backgroundColor="#121720"
      border="1px solid"
      borderColor="rgba(255,255,255,0.06)"
      borderRadius={18}
      padding={18}
      flexDirection="column"
      gap={12}
      overflow="hidden"
    >
      <Box flexDirection="column" gap={4}>
        <Text color="#FFFFFF" font="$rus" size={22} lineHeight="26px">
          {t('title')}
        </Text>
        <Text color="#7D8793" font="$footer" size={13} lineHeight="18px">
          {t('subtitle')}
        </Text>
      </Box>

      <Box flexDirection="column" gap={10} overflow="auto" style={{ flex: 1 }}>
        {items.map((item) => (
          <DashboardItem key={item.id} item={item} />
        ))}
      </Box>
    </Box>
  );
}

function DashboardItem({ item }: { item: RoomDashboardItem }): ReactNode {
  const t = useTranslations('room.dashboard');

  return (
    <Box
      width="$full"
      backgroundColor="#181C24"
      border="1px solid"
      borderColor="rgba(255,255,255,0.06)"
      borderRadius={14}
      padding={14}
      justifyContent="space-between"
      alignItems="flex-start"
      gap={14}
    >
      <Box flexDirection="column" gap={6} style={{ flex: 1 }}>
        <Box alignItems="center" gap={8} flexWrap="wrap">
          <EventBadge type={item.type} />
          <Text color="#D7DEE7" font="$footer" size={14} lineHeight="18px">
            {buildEventTitle(item, t)}
          </Text>
        </Box>

        <Text color="#7D8793" font="$footer" size={12} lineHeight="16px">
          {t('fileMeta', {
            name: item.file.name,
            language: item.file.language,
          })}
        </Text>
      </Box>

      <Text color="#7D8793" font="$footer" size={12} lineHeight="16px">
        {formatEventDate(item.createdAt)}
      </Text>
    </Box>
  );
}

function EventBadge({
  type,
}: {
  type: RoomDashboardItem['type'];
}): ReactNode {
  const t = useTranslations('room.dashboard');
  const config = getEventConfig(type, t);

  return (
    <Box
      backgroundColor={config.backgroundColor}
      border="1px solid"
      borderColor={config.borderColor}
      borderRadius={999}
      paddingTop={5}
      paddingRight={9}
      paddingBottom={5}
      paddingLeft={9}
    >
      <Text color={config.textColor} font="$footer" size={11} lineHeight="14px">
        {config.label}
      </Text>
    </Box>
  );
}

function PanelState({
  title,
  description,
  tone = 'muted',
}: {
  title: string;
  description: string;
  tone?: 'muted' | 'error';
}): ReactNode {
  return (
    <Box
      width="$full"
      height="$full"
      backgroundColor="#121720"
      border="1px solid"
      borderColor={tone === 'error' ? '#D14343' : 'rgba(255,255,255,0.06)'}
      borderRadius={18}
      padding={24}
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
      gap={10}
    >
      <Text color="#FFFFFF" font="$rus" size={22} lineHeight="26px" textAlign="center">
        {title}
      </Text>
      <Text
        color={tone === 'error' ? '#FFB4B4' : '#7D8793'}
        font="$footer"
        size={14}
        lineHeight="20px"
        textAlign="center"
      >
        {description}
      </Text>
    </Box>
  );
}

function getEventConfig(
  type: RoomDashboardItem['type'],
  t: ReturnType<typeof useTranslations>,
) {
  switch (type) {
    case 'FILE_CREATED':
      return {
        label: t('badgeCreated'),
        backgroundColor: 'rgba(67, 149, 61, 0.12)',
        borderColor: 'rgba(67, 149, 61, 0.4)',
        textColor: '#B7F3B3',
      };
    case 'FILE_UPDATED':
      return {
        label: t('badgeUpdated'),
        backgroundColor: 'rgba(95, 135, 255, 0.12)',
        borderColor: 'rgba(95, 135, 255, 0.4)',
        textColor: '#B8CCFF',
      };
    default:
      return {
        label: t('badgeJoined'),
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderColor: 'rgba(255,255,255,0.08)',
        textColor: '#D7DEE7',
      };
  }
}

function buildEventTitle(
  item: RoomDashboardItem,
  t: ReturnType<typeof useTranslations>,
) {
  const actorName = getActorName(item.actor, t);

  switch (item.type) {
    case 'FILE_CREATED':
      return t('actorCreated', { name: actorName });
    case 'FILE_UPDATED':
      return t('actorUpdated', { name: actorName });
    default:
      return t('actorOpened', { name: actorName });
  }
}

function getActorName(
  actor: RoomDashboardItem['actor'],
  t: ReturnType<typeof useTranslations>,
) {
  if (!actor) {
    return t('unknownActor');
  }

  const fullName = [actor.firstName, actor.lastName]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(' ')
    .trim();

  return fullName || actor.email;
}

function formatEventDate(value: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
