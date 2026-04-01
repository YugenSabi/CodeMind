import { type ReactNode } from 'react';
import type { RoomFile } from '@lib/files';
import { Button } from '@ui/button';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import { FileCard } from '../file-card/component';

type FileSidebarProps = {
  files: RoomFile[];
  selectedFileId: string | null;
  currentUserId?: string;
  isOwner: boolean;
  isCreatingFile: boolean;
  deletingFileId: string | null;
  onCreateFile: () => void;
  onSelectFile: (fileId: string) => void;
  onDeleteFile: (file: RoomFile) => void;
};

export function FileSidebar({
  files,
  selectedFileId,
  currentUserId,
  isOwner,
  isCreatingFile,
  deletingFileId,
  onCreateFile,
  onSelectFile,
  onDeleteFile,
}: FileSidebarProps): ReactNode {
  return (
    <Box
      width={320}
      backgroundColor="$background"
      border="1px solid"
      borderColor="$border"
      borderRadius={30}
      padding={18}
      flexDirection="column"
      gap={14}
    >
      <Box justifyContent="space-between" alignItems="center" gap={12}>
        <Box flexDirection="column" gap={4}>
          <Text color="#FFFFFF" font="$rus" size={22} lineHeight="26px">
            Файлы комнаты
          </Text>
          <Text color="$secondaryText" font="$footer" size={13} lineHeight="18px">
            Создай файл и подключись к realtime-редактированию.
          </Text>
        </Box>

        <Button
          type="button"
          variant="filled"
          height={42}
          padding={16}
          borderRadius={16}
          bg="#43953D"
          textColor="#FFFFFF"
          disabled={isCreatingFile}
          onClick={onCreateFile}
        >
          <Text color="#FFFFFF" font="$footer" size={14} lineHeight="18px">
            {isCreatingFile ? 'Создание...' : '+ Файл'}
          </Text>
        </Button>
      </Box>

      {files.length === 0 ? (
        <Box
          backgroundColor="rgba(145, 152, 161, 0.08)"
          border="1px solid"
          borderColor="$border"
          borderRadius={20}
          padding={16}
        >
          <Text color="$secondaryText" font="$footer" size={14} lineHeight="20px">
            В комнате пока нет файлов. Создай первый файл и он сразу подключится к
            collaborative editor.
          </Text>
        </Box>
      ) : (
        <Box flexDirection="column" gap={10}>
          {files.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              isActive={file.id === selectedFileId}
              canDelete={isOwner || file.ownerId === currentUserId}
              isDeleting={deletingFileId === file.id}
              onClick={() => {
                onSelectFile(file.id);
              }}
              onDelete={() => {
                onDeleteFile(file);
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
