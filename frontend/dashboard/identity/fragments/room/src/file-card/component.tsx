import { type ReactNode } from 'react';
import type { RoomFile } from '@lib/files';
import { Button } from '@ui/button';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';

type FileCardProps = {
  file: RoomFile;
  isActive: boolean;
  canDelete: boolean;
  isDeleting: boolean;
  onClick: () => void;
  onDelete: () => void;
};

export function FileCard({
  file,
  isActive,
  canDelete,
  isDeleting,
  onClick,
  onDelete,
}: FileCardProps): ReactNode {
  return (
    <Box width="$full" position="relative">
      <Button
        type="button"
        variant="ghost"
        width="$full"
        height="auto"
        minHeight={0}
        padding={0}
        textColor="#FFFFFF"
        onClick={onClick}
      >
        <Box
          width="$full"
          backgroundColor={isActive ? '#1C2530' : '#151B23'}
          border="1px solid"
          borderColor={isActive ? '#43953D' : '$border'}
          borderRadius={20}
          padding={16}
          flexDirection="column"
          alignItems="flex-start"
          gap={6}
        >
          <Text color="#FFFFFF" font="$footer" size={15} lineHeight="20px">
            {file.name}
          </Text>
          <Text color="$secondaryText" font="$footer" size={12} lineHeight="16px">
            {file.language} · {file.documentName}
          </Text>
        </Box>
      </Button>

      {canDelete ? (
        <Button
          type="button"
          variant="ghost"
          width={30}
          height={30}
          minWidth={30}
          minHeight={30}
          padding={0}
          border="1px solid"
          borderColor="#D14343"
          borderRadius={10}
          textColor="#FFB4B4"
          bg="#151B23"
          style={{ position: 'absolute', top: 10, right: 10 }}
          disabled={isDeleting}
          onClick={onDelete}
        >
          <Text color="#FFB4B4" font="$footer" size={16} lineHeight="16px">
            {isDeleting ? '…' : '×'}
          </Text>
        </Button>
      ) : null}
    </Box>
  );
}
