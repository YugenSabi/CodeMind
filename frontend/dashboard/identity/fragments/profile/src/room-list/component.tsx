'use client';

import { type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import type { ProfileRoomSummary } from '@lib/users';
import { Button } from '@ui/button';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import { formatProfileDate } from '../helpers';

type RoomListProps = {
  rooms: ProfileRoomSummary[];
  emptyMessage: string;
  deletingRoomId: string | null;
  onOpenRoom: (roomId: string) => void;
  onDeleteRoom?: (roomId: string) => void;
};

export function RoomList({
  rooms,
  emptyMessage,
  deletingRoomId,
  onOpenRoom,
  onDeleteRoom,
}: RoomListProps): ReactNode {
  const t = useTranslations('profile');

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
              {t('roomsList.summary', {
                mode: t(
                  room.mode === 'ALGORITHMS'
                    ? 'mode.algorithms'
                    : room.mode === 'INTERVIEWS'
                      ? 'mode.interviews'
                      : 'mode.justCoding',
                ),
                membersCount: room.membersCount,
                filesCount: room.filesCount,
              })}
            </Text>
            <Text color="#5B6470" font="$footer" size={12} lineHeight="16px">
              {t('roomsList.createdAt', {
                date: formatProfileDate(room.createdAt),
              })}
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
                {t('roomsList.open')}
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
                  {deletingRoomId === room.id
                    ? t('roomsList.deleting')
                    : t('roomsList.delete')}
                </Text>
              </Button>
            ) : null}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
