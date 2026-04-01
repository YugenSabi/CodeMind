import { type ReactNode } from 'react';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';

type TerminalPanelProps = {
  terminalRootRef: { current: HTMLDivElement | null };
  status: 'idle' | 'running' | 'stopped';
};

export function TerminalPanel({
  terminalRootRef,
  status,
}: TerminalPanelProps): ReactNode {
  return (
    <Box
      width="$full"
      minHeight={180}
      backgroundColor="#0B0F14"
      border="1px solid"
      borderColor="$border"
      borderRadius={24}
      padding={16}
      flexDirection="column"
      gap={10}
    >
      <Box justifyContent="space-between" alignItems="center">
        <Text color="#FFFFFF" font="$rus" size={18} lineHeight="22px">
          Terminal
        </Text>
        <Text color="$secondaryText" font="$footer" size={12} lineHeight="16px">
          {status === 'running'
            ? 'running'
            : status === 'stopped'
              ? 'stopped'
              : 'idle'}
        </Text>
      </Box>

      <div
        ref={terminalRootRef}
        style={{
          minHeight: 220,
          width: '100%',
        }}
      />
    </Box>
  );
}
