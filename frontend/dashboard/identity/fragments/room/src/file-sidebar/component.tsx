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
      width={280}
      backgroundColor="#121720"
      border="1px solid"
      borderColor="rgba(255,255,255,0.06)"
      borderRadius={18}
      paddingTop={12}
      paddingRight={10}
      paddingBottom={12}
      paddingLeft={10}
      flexDirection="column"
      gap={10}
      overflow="hidden"
    >
      <Box justifyContent="space-between" alignItems="center" gap={12}>
        <Box flexDirection="column" gap={4}>
          <Text color="#D7DEE7" font="$footer" size={12} lineHeight="14px">
            EXPLORER
          </Text>
          <Text color="#7D8793" font="$footer" size={12} lineHeight="16px">
            CodeMind
          </Text>
        </Box>

        <Button
          type="button"
          variant="ghost"
          height={28}
          padding={10}
          border="1px solid"
          borderColor="rgba(255,255,255,0.08)"
          borderRadius={8}
          bg="transparent"
          textColor="#FFFFFF"
          disabled={isCreatingFile}
          onClick={onCreateFile}
        >
          <Text color="#B8C1CC" font="$footer" size={12} lineHeight="14px">
            {isCreatingFile ? 'Создание...' : '+ Файл'}
          </Text>
        </Button>
      </Box>

      {files.length === 0 ? (
        <Box
          backgroundColor="rgba(255,255,255,0.03)"
          borderRadius={12}
          padding={12}
        >
          <Text color="#7D8793" font="$footer" size={12} lineHeight="18px">
            В комнате пока нет файлов. Создайте первый файл и он сразу откроется в редакторе.
          </Text>
        </Box>
      ) : (
        <Box flexDirection="column" gap={2}>
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
