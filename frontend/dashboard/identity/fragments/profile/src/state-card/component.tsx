import { type ReactNode } from 'react';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';

type StateCardProps = {
  title: string;
  description: string;
};

export function StateCard({
  title,
  description,
}: StateCardProps): ReactNode {
  return (
    <Box
      width="$full"
      backgroundColor="$cardBg"
      border="1px solid"
      borderColor="$border"
      borderRadius={26}
      paddingTop={44}
      paddingRight={32}
      paddingBottom={44}
      paddingLeft={32}
      justifyContent="center"
      alignItems="center"
      flexDirection="column"
      gap={12}
    >
      <Text color="#FFFFFF" font="$rus" size={28} lineHeight="32px">
        {title}
      </Text>
      <Text
        color="#7D8793"
        font="$footer"
        size={15}
        lineHeight="22px"
        textAlign="center"
      >
        {description}
      </Text>
    </Box>
  );
}
