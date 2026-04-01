import { type ReactNode } from 'react';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';

export function HeroContent(): ReactNode {
  return (
    <Box flexDirection="column" gap={10}>
      <Text size={36} font="$rus" textAlign="center">
        Платформа для совместной
        <br />
        работы над кодом с AI-ревьюером
      </Text>

      <Text
        size={20}
        color="$secondaryText"
        textAlign="center"
        font="$footer"
      >
        Пишите код вместе, отслеживайте изменения и получайте AI-подсказки
        <br />
        прямо в редакторе.
      </Text>
    </Box>
  );
}
