import { type ReactNode } from 'react';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';

type StatusMessageProps = {
  text: string;
  tone: 'error' | 'muted';
};

export function StatusMessage({
  text,
  tone,
}: StatusMessageProps): ReactNode {
  return (
    <Box
      backgroundColor={
        tone === 'error'
          ? 'rgba(209, 67, 67, 0.12)'
          : 'rgba(145, 152, 161, 0.08)'
      }
      border="1px solid"
      borderColor={tone === 'error' ? '#D14343' : '$border'}
      borderRadius={18}
      paddingTop={12}
      paddingRight={14}
      paddingBottom={12}
      paddingLeft={14}
    >
      <Text
        color={tone === 'error' ? '#FFB4B4' : '$secondaryText'}
        font="$footer"
        size={14}
        lineHeight="20px"
      >
        {text}
      </Text>
    </Box>
  );
}
