import { type ReactNode } from 'react';
import { Text } from '@ui/text';

type InlineMessageProps = {
  message: string;
};

export function InlineMessage({ message }: InlineMessageProps): ReactNode {
  return (
    <Text color="#7BC77A" font="$footer" size={13} lineHeight="18px">
      {message}
    </Text>
  );
}
