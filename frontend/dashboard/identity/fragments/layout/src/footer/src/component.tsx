import { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';

export const MainFooter = (): ReactNode => {
  const t = useTranslations('layout.footer');

  return (
    <Box width="$full" justifyContent="center">
      <Box
        as="footer"
        width="$full"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap={2}
        backgroundColor="$mainCards"
        border="1px solid"
        borderColor="$border"
        style={{
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          borderBottomRightRadius: 0,
          borderBottomLeftRadius: 0,
        }}
        paddingTop={15}
        paddingBottom={15}
      >
        <Text color="#FFFFFF" font="$footer" size={12}>
          {t('copyright')}
        </Text>
        <Text color="$secondaryText" font="$footer" size={10}>
          {t('poweredBy')}
        </Text>
      </Box>
    </Box>
  );
};
