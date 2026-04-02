'use client';

import { type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import type { RoomDirectory, RoomFile } from '@lib/files';
import type {
  Room,
  RoomDashboardItem,
  RoomParticipant,
  RoomSocket,
} from '@lib/rooms';
import { Box } from '@ui/layout';
import { CollaborativeEditor } from '../collaborative-editor';
import { FileSidebar } from '../file-sidebar/component';
import { RoomDashboard } from '../room-dashboard/component';
import { StatusCard } from '../state-shell/component';

type RoomContentProps = {
  room: Room;
  activeTab: 'editor' | 'dashboard';
  dashboardItems: RoomDashboardItem[];
  isDashboardLoading: boolean;
  dashboardErrorMessage: string | null;
  selectedFile: RoomFile | null;
  currentUserId?: string;
  isOwner: boolean;
  canManageStructure: boolean;
  isCreatingFile: boolean;
  deletingFileId: string | null;
  deletingDirectoryId: string | null;
  user: RoomParticipant | null;
  roomSocket: RoomSocket | null;
  onCreateFile: () => void;
  onCreateDirectory: () => void;
  onSelectFile: (fileId: string) => void;
  onDownloadFile: (file: RoomFile) => void;
  onDeleteFile: (file: RoomFile) => void;
  onDeleteDirectory: (directory: RoomDirectory) => void;
  onMoveFile: (fileId: string, directoryId: string | null) => void;
  onMoveDirectory: (directoryId: string, parentId: string | null) => void;
};

export function RoomContent({
  room,
  activeTab,
  dashboardItems,
  isDashboardLoading,
  dashboardErrorMessage,
  selectedFile,
  currentUserId,
  isOwner,
  canManageStructure,
  isCreatingFile,
  deletingFileId,
  deletingDirectoryId,
  user,
  roomSocket,
  onCreateFile,
  onCreateDirectory,
  onSelectFile,
  onDownloadFile,
  onDeleteFile,
  onDeleteDirectory,
  onMoveFile,
  onMoveDirectory,
}: RoomContentProps): ReactNode {
  const t = useTranslations('room');

  if (activeTab === 'dashboard') {
    return (
      <Box width="$full" minHeight={680}>
        <RoomDashboard
          items={dashboardItems}
          isLoading={isDashboardLoading}
          errorMessage={dashboardErrorMessage}
        />
      </Box>
    );
  }

  return (
    <Box
      width="$full"
      minHeight={680}
      gap={12}
      alignItems="stretch"
      minWidth={0}
    >
      <FileSidebar
        rootName={room.name}
        files={room.files}
        directories={room.directories}
        selectedFileId={selectedFile?.id ?? null}
        currentUserId={currentUserId}
        isOwner={isOwner}
        canManageStructure={canManageStructure}
        isCreatingFile={isCreatingFile}
        deletingFileId={deletingFileId}
        deletingDirectoryId={deletingDirectoryId}
        onCreateFile={onCreateFile}
        onCreateDirectory={onCreateDirectory}
        onSelectFile={onSelectFile}
        onDownloadFile={onDownloadFile}
        onDeleteFile={onDeleteFile}
        onDeleteDirectory={onDeleteDirectory}
        onMoveFile={onMoveFile}
        onMoveDirectory={onMoveDirectory}
      />

      <Box
        width="$full"
        minHeight={0}
        height={680}
        backgroundColor="#121720"
        border="1px solid"
        borderColor="rgba(255,255,255,0.06)"
        borderRadius={18}
        padding={12}
        minWidth={0}
        overflow="hidden"
        style={{ flex: 1 }}
      >
        {selectedFile ? (
          <CollaborativeEditor
            room={room}
            file={selectedFile}
            user={user}
            roomId={room.id}
            socket={roomSocket}
          />
        ) : (
          <Box
            width="$full"
            height="$full"
            alignItems="center"
            justifyContent="center"
          >
            <StatusCard
              title={t('content.noFileTitle')}
              description={t('content.noFileDescription')}
              tone="muted"
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
