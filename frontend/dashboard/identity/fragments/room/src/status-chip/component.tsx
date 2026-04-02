'use client';

import { type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';

type StatusChipProps = {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
};

export function StatusChip({ status }: StatusChipProps): ReactNode {
  const t = useTranslations('room');

  const labelByStatus = {
    connecting: t('statusChip.connecting'),
    connected: t('statusChip.connected'),
    disconnected: t('statusChip.disconnected'),
    error: t('statusChip.error'),
  } as const;

  return (
    <Box
      backgroundColor="rgba(145, 152, 161, 0.08)"
      border="1px solid"
      borderColor="$border"
      borderRadius={16}
      paddingTop={10}
      paddingRight={14}
      paddingBottom={10}
      paddingLeft={14}
    >
      <Text color="#FFFFFF" font="$footer" size={13} lineHeight="16px">
        {labelByStatus[status]}
      </Text>
    </Box>
  );
}
