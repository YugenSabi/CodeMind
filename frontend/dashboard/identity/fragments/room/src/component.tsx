'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthSession } from '@lib/auth';
import {
  createDirectory,
  createFile,
  deleteDirectory,
  deleteFile,
  downloadFile,
  type RoomDirectory,
  moveDirectory,
  moveFile,
  type RoomFile,
} from '@lib/files';
import {
  connectRoomSocket,
  deleteRoom,
  disconnectRoomSocket,
  downloadRoomProject,
  getRoom,
  getRoomDashboard,
  joinRoomSocket,
  removeRoomParticipant,
  type RoomDashboardItem,
  type Room,
  type RoomParticipant,
  type RoomSocket,
  type RoomSocketStatus,
} from '@lib/rooms';
import { Box } from '@ui/layout';
import { RoomConfirmState } from './confirm-state/component';
import { RoomContent } from './content/component';
import { CreateItemModal } from './create-item-modal/component';
import {
  buildNextDirectoryBaseName,
  buildNextFileBaseName,
  getFileExtension,
} from './helpers';
import { RoomToolbar } from './room-toolbar/component';
import {
  InlineErrorMessage,
  RoomStateShell,
  StatusCard,
} from './state-shell/component';
import type { ConfirmState } from './types';

type RoomComponentProps = {
  roomId: string;
};

export function RoomComponent({ roomId }: RoomComponentProps): ReactNode {
  const t = useTranslations('room');
  const router = useRouter();
  const { user, requiresVerification, verificationMessage } = useAuthSession();
  const [room, setRoom] = useState<Room | null>(null);
  const stableRoomId = room?.id;
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [socketStatus, setSocketStatus] = useState<RoomSocketStatus>('idle');
  const [roomSocket, setRoomSocket] = useState<RoomSocket | null>(null);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'dashboard'>('editor');
  const [isDeletingRoom, setIsDeletingRoom] = useState(false);
  const [isDownloadingProject, setIsDownloadingProject] = useState(false);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreateFileModalOpen, setIsCreateFileModalOpen] = useState(false);
  const [createItemType, setCreateItemType] = useState<'file' | 'directory'>(
    'file',
  );
  const [newFileBaseName, setNewFileBaseName] = useState('');
  const [newFileLanguage, setNewFileLanguage] =
    useState<RoomFile['language']>('TYPESCRIPT');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [removingParticipantId, setRemovingParticipantId] = useState<
    string | null
  >(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [deletingDirectoryId, setDeletingDirectoryId] = useState<string | null>(
    null,
  );
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [isRoomCodeCopied, setIsRoomCodeCopied] = useState(false);
  const [dashboardItems, setDashboardItems] = useState<RoomDashboardItem[]>([]);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [dashboardErrorMessage, setDashboardErrorMessage] = useState<
    string | null
  >(null);
  const participantsMenuRef = useRef<HTMLDivElement | null>(null);
  const roomCodeCopyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    async function loadRoom() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const nextRoom = await getRoom(roomId);

        if (!cancelled) {
          setRoom(nextRoom);
          setSelectedFileId(
            (current) => current ?? nextRoom.files[0]?.id ?? null,
          );
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : t('errors.loadRoom'),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadRoom();

    return () => {
      cancelled = true;
    };
  }, [roomId, t]);

  useEffect(() => {
    if (!stableRoomId || !user) {
      setSocketStatus('idle');
      return;
    }

    const socket = connectRoomSocket();
    setRoomSocket(socket);
    setSocketStatus('connecting');

    socket.on('connect', () => {
      joinRoomSocket(socket, {
        roomId: stableRoomId,
      });
      setSocketStatus('connected');
    });

    socket.on('connect_error', () => {
      setSocketStatus('error');
    });

    socket.on('disconnect', () => {
      setSocketStatus('idle');
    });

    socket.on(
      'room:joined',
      (payload: { participants?: RoomParticipant[] }) => {
        setRoom((current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            users: payload.participants ?? current.users,
          };
        });
      },
    );

    socket.on(
      'room:presence',
      (payload: { participants?: RoomParticipant[] }) => {
        setRoom((current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            users: payload.participants ?? current.users,
          };
        });
      },
    );

    socket.on('room:file_created', (payload: { file?: RoomFile }) => {
      setRoom((current) => {
        if (!current || !payload.file) {
          return current;
        }

        const nextFiles = [
          payload.file,
          ...current.files.filter((file) => file.id !== payload.file?.id),
        ];

        return {
          ...current,
          files: nextFiles,
        };
      });

      setSelectedFileId((current) => current ?? payload.file?.id ?? null);
    });

    socket.on('room:file_updated', (payload: { file?: RoomFile }) => {
      setRoom((current) => {
        if (!current || !payload.file) {
          return current;
        }

        return {
          ...current,
          files: current.files.map((file) =>
            file.id === payload.file?.id ? payload.file : file,
          ),
        };
      });
    });

    socket.on('room:file_deleted', (payload: { fileId?: string }) => {
      setRoom((current) => {
        if (!current || !payload.fileId) {
          return current;
        }

        return {
          ...current,
          files: current.files.filter((file) => file.id !== payload.fileId),
        };
      });

      setSelectedFileId((current) =>
        current === payload.fileId ? null : current,
      );
    });

    socket.on('room:tree_updated', (payload: { room?: Room }) => {
      const nextRoom = payload.room;

      if (!nextRoom) {
        return;
      }

      setRoom(nextRoom);
      setSelectedFileId((current) => {
        if (!current) {
          return nextRoom.files[0]?.id ?? null;
        }

        return nextRoom.files.some((file) => file.id === current)
          ? current
          : (nextRoom.files[0]?.id ?? null);
      });
    });

    return () => {
      setRoomSocket(null);
      disconnectRoomSocket(socket);
    };
  }, [stableRoomId, user?.id]);

  useEffect(() => {
    if (!isParticipantsOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (
        participantsMenuRef.current &&
        !participantsMenuRef.current.contains(event.target as Node)
      ) {
        setIsParticipantsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isParticipantsOpen]);

  useEffect(() => {
    const dashboardRoomId = room?.id;

    if (activeTab !== 'dashboard' || !dashboardRoomId) {
      return;
    }

    const nextRoomId = dashboardRoomId;
    let cancelled = false;

    async function loadRoomDashboard() {
      try {
        setIsDashboardLoading(true);
        setDashboardErrorMessage(null);

        const items = await getRoomDashboard(nextRoomId);

        if (!cancelled) {
          setDashboardItems(items);
        }
      } catch (error) {
        if (!cancelled) {
          setDashboardErrorMessage(
            error instanceof Error ? error.message : t('errors.loadDashboard'),
          );
        }
      } finally {
        if (!cancelled) {
          setIsDashboardLoading(false);
        }
      }
    }

    void loadRoomDashboard();

    return () => {
      cancelled = true;
    };
  }, [activeTab, room?.id, t]);

  useEffect(() => {
    return () => {
      if (roomCodeCopyTimeoutRef.current) {
        clearTimeout(roomCodeCopyTimeoutRef.current);
      }
    };
  }, []);

  if (requiresVerification) {
    return (
      <RoomStateShell>
        <StatusCard
          title={t('state.verifyTitle')}
          description={verificationMessage ?? t('state.verifyDescription')}
          tone="muted"
        />
      </RoomStateShell>
    );
  }

  const confirmDeleteRoom = () => {
    if (!room || isDeletingRoom) {
      return;
    }

    setConfirmState({ type: 'delete-room' });
  };

  const confirmRemoveParticipant = (participant: RoomParticipant) => {
    if (!room || removingParticipantId) {
      return;
    }

    setConfirmState({
      type: 'remove-participant',
      participant,
    });
  };

  const confirmDeleteFile = (file: RoomFile) => {
    if (deletingFileId) {
      return;
    }

    setConfirmState({
      type: 'delete-file',
      file,
    });
  };

  const confirmDeleteDirectory = (directory: RoomDirectory) => {
    if (deletingDirectoryId) {
      return;
    }

    setConfirmState({
      type: 'delete-directory',
      directory,
    });
  };

  const handleCopyRoomCode = async () => {
    if (!room?.code) {
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(room.code);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = room.code;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      setIsRoomCodeCopied(true);

      if (roomCodeCopyTimeoutRef.current) {
        clearTimeout(roomCodeCopyTimeoutRef.current);
      }

      roomCodeCopyTimeoutRef.current = setTimeout(() => {
        setIsRoomCodeCopied(false);
      }, 2000);
    } catch {
      setErrorMessage(t('errors.copyRoomCode'));
    }
  };

  const handleDownloadProject = async () => {
    if (!room || isDownloadingProject) {
      return;
    }

    try {
      setIsDownloadingProject(true);
      setErrorMessage(null);
      await downloadRoomProject(room.id, room.name);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t('errors.downloadProject'),
      );
    } finally {
      setIsDownloadingProject(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!room || !confirmState) {
      return;
    }

    if (confirmState.type === 'delete-room') {
      try {
        setIsDeletingRoom(true);
        setErrorMessage(null);

        await deleteRoom(room.id);
        setConfirmState(null);
        router.push('/dashboard');
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : t('errors.deleteRoom'),
        );
        setIsDeletingRoom(false);
        setConfirmState(null);
      }

      return;
    }

    if (confirmState.type === 'delete-file') {
      try {
        setDeletingFileId(confirmState.file.id);
        setErrorMessage(null);

        await deleteFile(confirmState.file.id);
        setConfirmState(null);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : t('errors.deleteFile'),
        );
        setConfirmState(null);
      } finally {
        setDeletingFileId(null);
      }

      return;
    }

    if (confirmState.type === 'delete-directory') {
      try {
        setDeletingDirectoryId(confirmState.directory.id);
        setErrorMessage(null);

        await deleteDirectory(confirmState.directory.id);
        setConfirmState(null);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : t('errors.deleteDirectory'),
        );
        setConfirmState(null);
      } finally {
        setDeletingDirectoryId(null);
      }

      return;
    }

    try {
      setRemovingParticipantId(confirmState.participant.id);
      setErrorMessage(null);

      const updatedRoom = await removeRoomParticipant(
        room.id,
        confirmState.participant.id,
      );

      setRoom(updatedRoom);
      setConfirmState(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t('errors.removeParticipant'),
      );
      setConfirmState(null);
    } finally {
      setRemovingParticipantId(null);
    }
  };

  const handleCreateFile = async () => {
    if (!room || isCreatingFile || !canManageStructure) {
      return;
    }

    const normalizedBaseName = newFileBaseName.trim();

    if (!normalizedBaseName) {
      setErrorMessage(t('errors.fileNameRequired'));
      return;
    }

    try {
      setIsCreatingFile(true);
      setErrorMessage(null);

      const nextFile = await createFile({
        roomId: room.id,
        name: `${normalizedBaseName}${getFileExtension(newFileLanguage)}`,
        language: newFileLanguage,
      });

      setRoom({
        ...room,
        files: [nextFile, ...room.files],
      });
      setSelectedFileId(nextFile.id);
      setIsCreateFileModalOpen(false);
      setCreateItemType('file');
      setNewFileBaseName(buildNextFileBaseName(room.files));
      setNewFileLanguage('TYPESCRIPT');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t('errors.createFile'),
      );
    } finally {
      setIsCreatingFile(false);
    }
  };

  const handleCreateDirectory = async () => {
    if (!room || isCreatingFile || !canManageStructure) {
      return;
    }

    const normalizedName = newFileBaseName.trim();

    if (!normalizedName) {
      setErrorMessage(t('errors.directoryNameRequired'));
      return;
    }

    try {
      setIsCreatingFile(true);
      setErrorMessage(null);

      const nextDirectory = await createDirectory({
        roomId: room.id,
        name: normalizedName,
      });

      setRoom({
        ...room,
        directories: [...room.directories, nextDirectory],
      });
      setIsCreateFileModalOpen(false);
      setCreateItemType('file');
      setNewFileBaseName('');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t('errors.createDirectory'),
      );
    } finally {
      setIsCreatingFile(false);
    }
  };

  const handleMoveFile = async (fileId: string, directoryId: string | null) => {
    if (!canManageStructure) {
      return;
    }

    try {
      setErrorMessage(null);

      const nextFile = await moveFile(fileId, directoryId);

      setRoom((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          files: current.files.map((file) =>
            file.id === nextFile.id ? nextFile : file,
          ),
        };
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t('errors.moveFile'),
      );
    }
  };

  const handleMoveDirectory = async (
    directoryId: string,
    parentId: string | null,
  ) => {
    if (!canManageStructure) {
      return;
    }

    try {
      setErrorMessage(null);

      const nextDirectory = await moveDirectory(directoryId, parentId);

      setRoom((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          directories: current.directories.map((directory) =>
            directory.id === nextDirectory.id ? nextDirectory : directory,
          ),
        };
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t('errors.moveDirectory'),
      );
    }
  };

  if (isLoading) {
    return (
      <RoomStateShell>
        <StatusCard
          title={t('state.loadingTitle')}
          description={t('state.loadingDescription')}
          tone="muted"
        />
      </RoomStateShell>
    );
  }

  if (errorMessage && !room) {
    return (
      <RoomStateShell>
        <StatusCard
          title={t('state.unavailableTitle')}
          description={errorMessage}
          tone="error"
        />
      </RoomStateShell>
    );
  }

  if (!room) {
    return (
      <RoomStateShell>
        <StatusCard
          title={t('state.unavailableTitle')}
          description={t('state.unavailableDescription')}
          tone="error"
        />
      </RoomStateShell>
    );
  }

  const isOwner = Boolean(user && user.id === room.owner.id);
  const canManageStructure =
    room.mode === 'JUST_CODING' || (room.mode === 'INTERVIEWS' && isOwner);
  const selectedFile =
    room.files.find((file) => file.id === selectedFileId) ??
    room.files[0] ??
    null;

  return (
    <>
      <Box width="$full" flexDirection="column" gap={12}>
        <RoomToolbar
          room={room}
          socketStatus={socketStatus}
          activeTab={activeTab}
          isOwner={isOwner}
          isDeletingRoom={isDeletingRoom}
          isDownloadingProject={isDownloadingProject}
          isParticipantsOpen={isParticipantsOpen}
          removingParticipantId={removingParticipantId}
          isRoomCodeCopied={isRoomCodeCopied}
          participantsMenuRef={participantsMenuRef}
          onCopyRoomCode={handleCopyRoomCode}
          onSelectTab={setActiveTab}
          onDeleteRoom={confirmDeleteRoom}
          onDownloadProject={() => {
            void handleDownloadProject();
          }}
          onToggleParticipants={() => {
            setIsParticipantsOpen((current) => !current);
          }}
          onRemoveParticipant={confirmRemoveParticipant}
        />

        {errorMessage ? <InlineErrorMessage message={errorMessage} /> : null}

        <RoomContent
          room={room}
          activeTab={activeTab}
          dashboardItems={dashboardItems}
          isDashboardLoading={isDashboardLoading}
          dashboardErrorMessage={dashboardErrorMessage}
          selectedFile={selectedFile}
          currentUserId={user?.id}
          isOwner={isOwner}
          canManageStructure={canManageStructure}
          isCreatingFile={isCreatingFile}
          deletingFileId={deletingFileId}
          deletingDirectoryId={deletingDirectoryId}
          user={user ?? null}
          roomSocket={roomSocket}
          onCreateFile={() => {
            setCreateItemType('file');
            setNewFileBaseName(buildNextFileBaseName(room.files));
            setNewFileLanguage('TYPESCRIPT');
            setIsCreateFileModalOpen(true);
          }}
          onCreateDirectory={() => {
            setCreateItemType('directory');
            setNewFileBaseName(buildNextDirectoryBaseName(room.directories));
            setIsCreateFileModalOpen(true);
          }}
          onSelectFile={(fileId) => {
            setSelectedFileId(fileId);
          }}
          onDownloadFile={(file) => {
            void downloadFile(file.id, file.name);
          }}
          onDeleteFile={confirmDeleteFile}
          onDeleteDirectory={confirmDeleteDirectory}
          onMoveFile={(fileId, directoryId) => {
            void handleMoveFile(fileId, directoryId);
          }}
          onMoveDirectory={(directoryId, parentId) => {
            void handleMoveDirectory(directoryId, parentId);
          }}
        />
      </Box>

      <RoomConfirmState
        confirmState={confirmState}
        isDeletingRoom={isDeletingRoom}
        removingParticipantId={removingParticipantId}
        deletingFileId={deletingFileId}
        deletingDirectoryId={deletingDirectoryId}
        onCancel={() => {
          if (
            isDeletingRoom ||
            removingParticipantId ||
            deletingFileId ||
            deletingDirectoryId
          ) {
            return;
          }

          setConfirmState(null);
        }}
        onConfirm={() => {
          void handleConfirmAction();
        }}
      />

      <CreateItemModal
        isOpen={isCreateFileModalOpen}
        itemType={createItemType}
        fileName={newFileBaseName}
        fileExtension={getFileExtension(newFileLanguage)}
        language={newFileLanguage}
        isLoading={isCreatingFile}
        onNameChange={setNewFileBaseName}
        onLanguageChange={(value) => {
          setNewFileLanguage(value);
        }}
        onCancel={() => {
          if (isCreatingFile) {
            return;
          }

          setIsCreateFileModalOpen(false);
        }}
        onConfirm={() => {
          if (createItemType === 'directory') {
            void handleCreateDirectory();
            return;
          }

          void handleCreateFile();
        }}
      />
    </>
  );
}
