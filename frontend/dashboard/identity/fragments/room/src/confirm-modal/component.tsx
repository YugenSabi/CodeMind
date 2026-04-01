import { type ReactNode } from 'react';
import { Button } from '@ui/button';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';

type ConfirmModalProps = {
  title: string;
  description: string;
  isLoading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmModal({
  title,
  description,
  isLoading,
  onCancel,
  onConfirm,
}: ConfirmModalProps): ReactNode {
  return (
    <Box
      position="fixed"
      inset={0}
      zIndex={20}
      backgroundColor="rgba(8, 12, 18, 0.72)"
      alignItems="center"
      justifyContent="center"
      padding={24}
      style={{ backdropFilter: 'blur(10px)' }}
    >
      <Box
        width="$full"
        maxWidth={440}
        backgroundColor="#121720"
        border="1px solid"
        borderColor="rgba(255,255,255,0.08)"
        borderRadius={20}
        paddingTop={20}
        paddingRight={20}
        paddingBottom={18}
        paddingLeft={20}
        flexDirection="column"
        gap={16}
        shadow="$md"
      >
        <Box flexDirection="column" gap={6}>
          <Text color="#FFFFFF" font="$rus" size={24} lineHeight="28px">
            {title}
          </Text>
          <Text color="#7D8793" font="$footer" size={13} lineHeight="18px">
            {description}
          </Text>
        </Box>

        <Box justifyContent="flex-end" alignItems="center" gap={10} paddingTop={4}>
          <Button
            type="button"
            variant="ghost"
            height={38}
            padding={16}
            border="1px solid"
            borderColor="rgba(255,255,255,0.08)"
            borderRadius={10}
            textColor="#C7D0DB"
            bg="transparent"
            disabled={isLoading}
            onClick={onCancel}
          >
            <Text color="#C7D0DB" font="$footer" size={13} lineHeight="16px">
              Отмена
            </Text>
          </Button>

          <Button
            type="button"
            variant="ghost"
            height={38}
            padding={16}
            border="1px solid"
            borderColor="rgba(209,67,67,0.35)"
            borderRadius={10}
            textColor="#E5B3B3"
            bg="rgba(209,67,67,0.08)"
            disabled={isLoading}
            onClick={onConfirm}
          >
            <Text color="#E5B3B3" font="$footer" size={13} lineHeight="16px">
              {isLoading ? 'Удаление...' : 'Удалить'}
            </Text>
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
