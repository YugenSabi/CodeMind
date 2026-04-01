import { type ReactNode } from 'react';
import { Button } from '@ui/button';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';

type DashboardActionsProps = {
  isCreatingRoom: boolean;
  errorMessage: string | null;
  onCreateRoom: () => void;
};

export function DashboardActions({
  isCreatingRoom,
  errorMessage,
  onCreateRoom,
}: DashboardActionsProps): ReactNode {
  return (
    <>
      <Box flexDirection="row" gap={10} padding={10}>
        <Button
          type="button"
          variant="filled"
          height={80}
          minWidth={375}
          padding={10}
          borderRadius={45}
          bg="#43953D"
          textColor="#FFFFFF"
          disabled={isCreatingRoom}
          onClick={onCreateRoom}
        >
          <Text size={24}>
            {isCreatingRoom ? 'Создание...' : 'Создать комнату'}
          </Text>
        </Button>

        <Button
          type="link"
          href="/join"
          padding={25}
          height={80}
          minWidth={375}
          border="1px solid"
          borderColor="$border"
          borderRadius={45}
          textColor="#FFFFFF"
        >
          <Text size={24}>Присоединиться</Text>
        </Button>
      </Box>

      {errorMessage ? (
        <Box
          width="$full"
          maxWidth={520}
          backgroundColor="rgba(209, 67, 67, 0.12)"
          border="1px solid"
          borderColor="#D14343"
          borderRadius={18}
          paddingTop={12}
          paddingRight={14}
          paddingBottom={12}
          paddingLeft={14}
        >
          <Text color="#FFB4B4" font="$footer" size={14} lineHeight="20px" textAlign="center">
            {errorMessage}
          </Text>
        </Box>
      ) : null}
    </>
  );
}
