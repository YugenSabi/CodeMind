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
      height={230}
      minHeight={230}
      backgroundColor="#0B0F14"
      borderTop="1px solid"
      borderColor="rgba(255,255,255,0.06)"
      flexDirection="column"
      overflow="hidden"
    >
      <Box
        justifyContent="space-between"
        alignItems="center"
        paddingTop={10}
        paddingRight={14}
        paddingBottom={10}
        paddingLeft={14}
        backgroundColor="#181C24"
      >
        <Text color="#B8C1CC" font="$footer" size={12} lineHeight="16px">
          Terminal
        </Text>
        <Text color="#7D8793" font="$footer" size={11} lineHeight="14px">
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
          height: 188,
          width: '100%',
          padding: '12px 14px 14px',
        }}
      />
    </Box>
  );
}
