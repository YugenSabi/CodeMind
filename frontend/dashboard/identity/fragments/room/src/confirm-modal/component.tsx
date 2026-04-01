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
      backgroundColor="rgba(21, 27, 35, 0.72)"
      alignItems="center"
      justifyContent="center"
      padding={24}
    >
      <Box
        width="$full"
        maxWidth={480}
        backgroundColor="$cardBg"
        border="1px solid"
        borderColor="$border"
        borderRadius={28}
        padding={24}
        flexDirection="column"
        gap={18}
      >
        <Box flexDirection="column" gap={8}>
          <Text color="#FFFFFF" font="$rus" size={28} lineHeight="32px">
            {title}
          </Text>
          <Text color="$secondaryText" font="$footer" size={16} lineHeight="22px">
            {description}
          </Text>
        </Box>

        <Box justifyContent="flex-end" gap={10}>
          <Button
            type="button"
            variant="ghost"
            height={44}
            padding={18}
            border="1px solid"
            borderColor="$border"
            borderRadius={16}
            textColor="#FFFFFF"
            disabled={isLoading}
            onClick={onCancel}
          >
            <Text color="#FFFFFF" font="$footer" size={14} lineHeight="18px">
              Отмена
            </Text>
          </Button>

          <Button
            type="button"
            variant="ghost"
            height={44}
            padding={18}
            border="1px solid"
            borderColor="#D14343"
            borderRadius={16}
            textColor="#FFB4B4"
            disabled={isLoading}
            onClick={onConfirm}
          >
            <Text color="#FFB4B4" font="$footer" size={14} lineHeight="18px">
              {isLoading ? 'Удаление...' : 'Удалить'}
            </Text>
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
