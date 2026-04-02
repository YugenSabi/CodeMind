'use client';

import { type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';

export function HeroContent(): ReactNode {
  const t = useTranslations('dashboard.hero');

  return (
    <Box flexDirection="column" gap={10}>
      <Text size={36} font="$rus" textAlign="center">
        {t('titleLine1')}
        <br />
        {t('titleLine2')}
      </Text>

      <Text
        size={20}
        color="$secondaryText"
        textAlign="center"
        font="$footer"
      >
        {t('descriptionLine1')}
        <br />
        {t('descriptionLine2')}
      </Text>
    </Box>
  );
}
