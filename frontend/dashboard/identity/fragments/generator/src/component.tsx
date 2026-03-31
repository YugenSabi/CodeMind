'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';

export function GeneratorComponent(): ReactNode {
    const t = useTranslations('generator');

    return (
        <Box
            minHeight="100vh"
            justifyContent="center"
            alignItems="center"
            backgroundColor={'$cardBg'}
        >
            <Box
                maxWidth={820}
                width="$full"
                flexDirection="column"
                alignItems="center"
                padding={48}
                borderRadius={32}
                backgroundColor={'$primaryText'}
            >
                <Text font="$eng" size={30} color="#FFFFFF" textAlign="center">
                    {t('title')}
                </Text>
            </Box>
        </Box>
    );
}
