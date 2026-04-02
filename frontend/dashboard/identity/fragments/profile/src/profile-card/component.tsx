import { type ReactNode } from 'react';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';

type ProfileCardProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function ProfileCard({
  title,
  subtitle,
  children,
}: ProfileCardProps): ReactNode {
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
      </Box>
      {children}
    </Box>
  );
}
