import { type ReactNode } from 'react';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';

export function RoomStateShell({ children }: { children: ReactNode }): ReactNode {
  return (
    <Box width="$full" minHeight="$full" alignItems="center" justifyContent="center">
      <Box width="$full" maxWidth={640}>{children}</Box>
    </Box>
  );
}

export function StatusCard({
  title,
  description,
  tone,
}: {
  title: string;
  description: string;
  tone: 'error' | 'muted';
}): ReactNode {
  return (
    <Box
      width="$full"
      backgroundColor="$cardBg"
      border="1px solid"
      borderColor={tone === 'error' ? '#D14343' : '$border'}
      borderRadius={30}
      padding={24}
      flexDirection="column"
      gap={10}
      alignItems="center"
    >
      <Text color="#FFFFFF" font="$rus" size={24} lineHeight="30px" textAlign="center">
        {title}
      </Text>
      <Text
        color={tone === 'error' ? '#FFB4B4' : '$secondaryText'}
        font="$footer"
        size={16}
        lineHeight="22px"
        textAlign="center"
      >
        {description}
      </Text>
    </Box>
  );
}

export function InlineErrorMessage({ message }: { message: string }): ReactNode {
  return (
    <Box
      width="$full"
      backgroundColor="rgba(209, 67, 67, 0.12)"
      border="1px solid"
      borderColor="#D14343"
      borderRadius={20}
      paddingTop={12}
      paddingRight={16}
      paddingBottom={12}
      paddingLeft={16}
    >
      <Text color="#FFB4B4" font="$footer" size={14} lineHeight="20px">
        {message}
      </Text>
    </Box>
  );
}
