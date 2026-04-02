import { type ReactNode } from 'react';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';

type ErrorBannerProps = {
  message: string | null;
};

export function ErrorBanner({ message }: ErrorBannerProps): ReactNode {
  if (!message) {
    return null;
  }

  return (
    <Box
      width="$full"
      backgroundColor="rgba(209, 67, 67, 0.12)"
      border="1px solid"
      borderColor="#D14343"
      borderRadius={18}
      paddingTop={12}
      paddingRight={14}
      paddingBottom={12}
      paddingLeft={14}
    >
      <Text color="#FFB4B4" font="$footer" size={13} lineHeight="18px">
        {message}
      </Text>
    </Box>
  );
}
