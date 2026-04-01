import { type ReactNode } from 'react';
import type { RoomFile } from '@lib/files';
import { Button } from '@ui/button';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';

type EditorHeaderProps = {
  file: RoomFile;
  isRunning: boolean;
  canStop: boolean;
  onRun: () => void;
  onStop: () => void;
};

export function EditorHeader({
  file,
  isRunning,
  canStop,
  onRun,
  onStop,
}: EditorHeaderProps): ReactNode {
  return (
    <Box
      justifyContent="space-between"
      alignItems="center"
      gap={12}
      paddingTop={12}
      paddingRight={16}
      paddingBottom={12}
      paddingLeft={16}
      borderBottom="1px solid"
      borderColor="rgba(255,255,255,0.06)"
      backgroundColor="#181C24"
    >
      <Box flexDirection="column" gap={2} minWidth={0}>
        <Text color="#FFFFFF" font="$rus" size={17} lineHeight="20px">
          {file.name}
        </Text>
        <Text color="#7D8793" font="$footer" size={12} lineHeight="16px">
          {file.language}
        </Text>
      </Box>

      <Box alignItems="center" gap={8}>
        <Button
          type="button"
          variant="filled"
          height={34}
          padding={12}
          borderRadius={10}
          bg="#2E7D32"
          textColor="#FFFFFF"
          disabled={isRunning}
          onClick={onRun}
        >
          <Text color="#FFFFFF" font="$footer" size={12} lineHeight="14px">
            {isRunning ? 'Running...' : 'Run'}
          </Text>
        </Button>

        <Button
          type="button"
          variant="ghost"
          height={34}
          padding={12}
          border="1px solid"
          borderColor="rgba(255,255,255,0.08)"
          borderRadius={10}
          textColor="#FFFFFF"
          bg="transparent"
          disabled={!canStop}
          onClick={onStop}
        >
          <Text color="#FFFFFF" font="$footer" size={12} lineHeight="14px">
            Stop
          </Text>
        </Button>
      </Box>
    </Box>
  );
}
