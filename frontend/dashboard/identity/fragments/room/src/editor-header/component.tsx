import { type ReactNode } from 'react';
import type { RoomFile } from '@lib/files';
import { Button } from '@ui/button';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import { StatusChip } from '../status-chip/component';

type PresenceUser = {
  name: string;
  color: string;
};

type EditorHeaderProps = {
  file: RoomFile;
  presence: PresenceUser[];
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  isRunning: boolean;
  canStop: boolean;
  onRun: () => void;
  onStop: () => void;
};

export function EditorHeader({
  file,
  presence,
  status,
  isRunning,
  canStop,
  onRun,
  onStop,
}: EditorHeaderProps): ReactNode {
  return (
    <Box justifyContent="space-between" alignItems="center" gap={12}>
      <Box flexDirection="column" gap={4}>
        <Text color="#FFFFFF" font="$rus" size={20} lineHeight="24px">
          {file.name}
        </Text>
        <Text color="$secondaryText" font="$footer" size={13} lineHeight="18px">
          {file.language} · {file.documentName}
        </Text>
      </Box>

      <Box alignItems="center" gap={8} flexWrap="wrap">
        <Button
          type="button"
          variant="filled"
          height={40}
          padding={14}
          borderRadius={14}
          bg="#43953D"
          textColor="#FFFFFF"
          disabled={isRunning}
          onClick={onRun}
        >
          <Text color="#FFFFFF" font="$footer" size={13} lineHeight="16px">
            {isRunning ? 'Running...' : 'Run'}
          </Text>
        </Button>

        <Button
          type="button"
          variant="ghost"
          height={40}
          padding={14}
          border="1px solid"
          borderColor="$border"
          borderRadius={14}
          textColor="#FFFFFF"
          disabled={!canStop}
          onClick={onStop}
        >
          <Text color="#FFFFFF" font="$footer" size={13} lineHeight="16px">
            Stop
          </Text>
        </Button>

        {presence.map((participant) => (
          <Box
            key={`${participant.name}-${participant.color}`}
            backgroundColor="rgba(255,255,255,0.06)"
            border="1px solid"
            borderColor="$border"
            borderRadius={14}
            paddingTop={8}
            paddingRight={10}
            paddingBottom={8}
            paddingLeft={10}
            alignItems="center"
            gap={8}
          >
            <Box
              width={10}
              height={10}
              borderRadius={999}
              style={{ backgroundColor: participant.color }}
            />
            <Text color="#FFFFFF" font="$footer" size={13} lineHeight="16px">
              {participant.name}
            </Text>
          </Box>
        ))}

        <StatusChip status={status} />
      </Box>
    </Box>
  );
}
