'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthSession } from '@lib/auth';
import { createFile, deleteFile, type RoomFile } from '@lib/files';
import {
  connectRoomSocket,
  deleteRoom,
  disconnectRoomSocket,
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
import { CollaborativeEditor } from './collaborative-editor';
import { ConfirmModal } from './confirm-modal/component';
import { CreateFileModal } from './create-file-modal/component';
import { FileSidebar } from './file-sidebar/component';
import { RoomDashboard } from './room-dashboard/component';
import { RoomToolbar } from './room-toolbar/component';
import {
  InlineErrorMessage,
  RoomStateShell,
  StatusCard,
} from './state-shell/component';

type RoomComponentProps = {
  roomId: string;
};

type ConfirmState =
  | {
      type: 'delete-room';
    }
  | {
      type: 'remove-participant';
      participant: RoomParticipant;
    }
  | {
      type: 'delete-file';
      file: RoomFile;
    }
  | null;

export function RoomComponent({ roomId }: RoomComponentProps): ReactNode {
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
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreateFileModalOpen, setIsCreateFileModalOpen] = useState(false);
  const [newFileBaseName, setNewFileBaseName] = useState('');
  const [newFileLanguage, setNewFileLanguage] =
    useState<RoomFile['language']>('TYPESCRIPT');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [removingParticipantId, setRemovingParticipantId] = useState<string | null>(
    null,
  );
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [isRoomCodeCopied, setIsRoomCodeCopied] = useState(false);
  const [dashboardItems, setDashboardItems] = useState<RoomDashboardItem[]>([]);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [dashboardErrorMessage, setDashboardErrorMessage] = useState<string | null>(
    null,
  );
  const participantsMenuRef = useRef<HTMLDivElement | null>(null);
  const roomCodeCopyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRoom() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const nextRoom = await getRoom(roomId);

        if (!cancelled) {
          setRoom(nextRoom);
          setSelectedFileId((current) => current ?? nextRoom.files[0]?.id ?? null);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Не удалось загрузить комнату. Попробуйте еще раз.',
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
  }, [roomId]);

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

    socket.on('room:joined', (payload: { participants?: RoomParticipant[] }) => {
      setRoom((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          users: payload.participants ?? current.users,
        };
      });
    });

    socket.on('room:presence', (payload: { participants?: RoomParticipant[] }) => {
      setRoom((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          users: payload.participants ?? current.users,
        };
      });
    });

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

    const roomId = dashboardRoomId;

    let cancelled = false;

    async function loadRoomDashboard() {
      try {
        setIsDashboardLoading(true);
        setDashboardErrorMessage(null);

        const items = await getRoomDashboard(roomId);

        if (!cancelled) {
          setDashboardItems(items);
        }
      } catch (error) {
        if (!cancelled) {
          setDashboardErrorMessage(
            error instanceof Error
              ? error.message
              : 'Не удалось загрузить dashboard комнаты.',
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
  }, [activeTab, room?.id]);

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
          title="Подтвердите аккаунт"
          description={
            verificationMessage ??
            'Без подтверждения почты совместное редактирование недоступно.'
          }
          tone="muted"
        />
      </RoomStateShell>
    );
  }

  const isOwner = Boolean(user && room && user.id === room.owner.id);
  const selectedFile =
    room?.files.find((file) => file.id === selectedFileId) ?? room?.files[0] ?? null;

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
      setErrorMessage('Не удалось скопировать код комнаты. Попробуйте еще раз.');
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
          error instanceof Error
            ? error.message
            : 'Не удалось удалить комнату. Попробуйте еще раз.',
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
          error instanceof Error
            ? error.message
            : 'Не удалось удалить файл. Попробуйте еще раз.',
        );
        setConfirmState(null);
      } finally {
        setDeletingFileId(null);
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
        error instanceof Error
          ? error.message
          : 'Не удалось удалить участника. Попробуйте еще раз.',
      );
      setConfirmState(null);
    } finally {
      setRemovingParticipantId(null);
    }
  };

  const handleCreateFile = async () => {
    if (!room || isCreatingFile) {
      return;
    }

    const normalizedBaseName = newFileBaseName.trim();

    if (!normalizedBaseName) {
      setErrorMessage('Введите название файла');
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
      setNewFileBaseName(buildNextFileBaseName(room.files));
      setNewFileLanguage('TYPESCRIPT');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Не удалось создать файл. Попробуйте еще раз.',
      );
    } finally {
      setIsCreatingFile(false);
    }
  };

  if (isLoading) {
    return (
      <RoomStateShell>
        <StatusCard
          title="Загрузка комнаты"
          description="Подготавливаем комнату и загружаем участников."
          tone="muted"
        />
      </RoomStateShell>
    );
  }

  if (errorMessage && !room) {
    return (
      <RoomStateShell>
        <StatusCard
          title="Комната недоступна"
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
          title="Комната недоступна"
          description="Не удалось открыть комнату."
          tone="error"
        />
      </RoomStateShell>
    );
  }

  return (
    <>
      <Box width="$full" flexDirection="column" gap={12}>
        <RoomToolbar
          room={room}
          socketStatus={socketStatus}
          activeTab={activeTab}
          isOwner={isOwner}
          isDeletingRoom={isDeletingRoom}
          isParticipantsOpen={isParticipantsOpen}
          removingParticipantId={removingParticipantId}
          isRoomCodeCopied={isRoomCodeCopied}
          participantsMenuRef={participantsMenuRef}
          onCopyRoomCode={handleCopyRoomCode}
          onSelectTab={setActiveTab}
          onDeleteRoom={confirmDeleteRoom}
          onToggleParticipants={() => {
            setIsParticipantsOpen((current) => !current);
          }}
          onRemoveParticipant={confirmRemoveParticipant}
        />

        {errorMessage ? <InlineErrorMessage message={errorMessage} /> : null}

        {activeTab === 'dashboard' ? (
          <Box width="$full" minHeight={680}>
            <RoomDashboard
              items={dashboardItems}
              isLoading={isDashboardLoading}
              errorMessage={dashboardErrorMessage}
            />
          </Box>
        ) : (
          <Box
            width="$full"
            minHeight={680}
            gap={12}
            alignItems="stretch"
            minWidth={0}
          >
            <FileSidebar
              files={room.files}
              selectedFileId={selectedFile?.id ?? null}
              currentUserId={user?.id}
              isOwner={isOwner}
              isCreatingFile={isCreatingFile}
              deletingFileId={deletingFileId}
              onCreateFile={() => {
                setNewFileBaseName(buildNextFileBaseName(room.files));
                setNewFileLanguage('TYPESCRIPT');
                setIsCreateFileModalOpen(true);
              }}
              onSelectFile={(fileId) => {
                setSelectedFileId(fileId);
              }}
              onDeleteFile={confirmDeleteFile}
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
                    title="Файл не выбран"
                    description="Создайте файл в комнате и здесь откроется редактор."
                    tone="muted"
                  />
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Box>

      {confirmState ? (
        <ConfirmModal
          title={
            confirmState.type === 'delete-room'
              ? 'Удалить комнату'
              : confirmState.type === 'delete-file'
                ? 'Удалить файл'
                : 'Удалить участника'
          }
          description={
            confirmState.type === 'delete-room'
              ? 'Вы точно хотите удалить комнату?'
              : confirmState.type === 'delete-file'
                ? `Вы точно хотите удалить файл ${confirmState.file.name}?`
                : `Вы точно хотите удалить участника ${getParticipantName(
                    confirmState.participant,
                  )}?`
          }
          isLoading={
            confirmState.type === 'delete-room'
              ? isDeletingRoom
              : confirmState.type === 'delete-file'
                ? deletingFileId === confirmState.file.id
                : removingParticipantId === confirmState.participant.id
          }
          onCancel={() => {
            if (isDeletingRoom || removingParticipantId || deletingFileId) {
              return;
            }

            setConfirmState(null);
          }}
          onConfirm={() => {
            void handleConfirmAction();
          }}
        />
      ) : null}

      {isCreateFileModalOpen ? (
        <CreateFileModal
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
            void handleCreateFile();
          }}
        />
      ) : null}
    </>
  );
}

function getParticipantName(participant: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}) {
  const fullName = [participant.firstName, participant.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  return fullName || participant.email;
}

function buildNextFileBaseName(files: RoomFile[]) {
  const nextIndex = files.length + 1;
  return `main-${nextIndex}`;
}

function getFileExtension(language: RoomFile['language']) {
  switch (language) {
    case 'TYPESCRIPT':
      return '.ts';
    case 'JAVASCRIPT':
      return '.js';
    case 'PYTHON':
      return '.py';
    case 'JSON':
      return '.json';
    case 'HTML':
      return '.html';
    case 'CSS':
      return '.css';
    case 'MARKDOWN':
      return '.md';
    default:
      return '.txt';
  }
}
