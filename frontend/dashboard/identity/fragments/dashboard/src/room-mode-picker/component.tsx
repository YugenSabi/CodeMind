'use client';

import { type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import type { RoomMode } from '@lib/rooms';
import { Button } from '@ui/button';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';

type RoomModePickerProps = {
  isLoading: boolean;
  onClose: () => void;
  onSelectMode: (mode: RoomMode) => void;
};

export function RoomModePicker({
  isLoading,
  onClose,
  onSelectMode,
}: RoomModePickerProps): ReactNode {
  const t = useTranslations('dashboard.roomModePicker');

  const roomModeOptions: Array<{
    mode: RoomMode;
    title: string;
    description: string;
  }> = [
    {
      mode: 'JUST_CODING',
      title: t('modes.justCodingTitle'),
      description: t('modes.justCodingDescription'),
    },
    {
      mode: 'INTERVIEWS',
      title: t('modes.interviewsTitle'),
      description: t('modes.interviewsDescription'),
    },
    {
      mode: 'ALGORITHMS',
      title: t('modes.algorithmsTitle'),
      description: t('modes.algorithmsDescription'),
    },
  ];

  return (
    <Box
      position="fixed"
      inset={0}
      zIndex={20}
      backgroundColor="rgba(8, 12, 18, 0.72)"
      alignItems="center"
      justifyContent="center"
      padding={24}
      style={{ backdropFilter: 'blur(10px)' }}
    >
      <Box
        width="$full"
        maxWidth={850}
        backgroundColor="#121720"
        border="1px solid"
        borderColor="rgba(255,255,255,0.08)"
        borderRadius={20}
        paddingTop={20}
        paddingRight={20}
        paddingBottom={18}
        paddingLeft={20}
        flexDirection="column"
        gap={16}
        shadow="$md"
      >
        <Box justifyContent="space-between" alignItems="center" gap={16}>
          <Box flexDirection="column" gap={6}>
            <Text color="#FFFFFF" font="$rus" size={24} lineHeight="28px">
              {t('title')}
            </Text>
            <Text color="#7D8793" font="$footer" size={13} lineHeight="18px">
              {t('description')}
            </Text>
          </Box>
          <Button
            type="button"
            variant="ghost"
            height={38}
            padding={16}
            border="1px solid"
            borderColor="rgba(255,255,255,0.08)"
            borderRadius={10}
            textColor="#C7D0DB"
            bg="transparent"
            disabled={isLoading}
            onClick={onClose}
          >
            <Text color="#C7D0DB" font="$footer" size={13} lineHeight="16px">
              {t('cancel')}
            </Text>
          </Button>
        </Box>

        <Box width="$full" gap={12} alignItems="stretch">
          {roomModeOptions.map((option) => (
            <Button
              key={option.mode}
              type="button"
              variant="ghost"
              padding={0}
              height="auto"
              border="1px solid"
              borderColor="rgba(255,255,255,0.08)"
              borderRadius={18}
              bg="#0F141C"
              textColor="#FFFFFF"
              disabled={isLoading}
              onClick={() => {
                onSelectMode(option.mode);
              }}
            >
              <Box
                width="$full"
                minHeight={155}
                flexDirection="column"
                justifyContent="space-between"
                alignItems="flex-start"
                gap={18}
                padding={20}
              >
                <Box flexDirection="column" gap={8}>
                  <Text color="#FFFFFF" font="$rus" size={22} lineHeight="26px">
                    {option.title}
                  </Text>
                  <Text color="#7D8793" font="$footer" size={14} lineHeight="20px">
                    {option.description}
                  </Text>
                </Box>
              </Box>
            </Button>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
