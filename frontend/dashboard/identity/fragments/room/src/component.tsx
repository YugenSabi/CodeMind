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
  joinRoomSocket,
  removeRoomParticipant,
  type Room,
  type RoomParticipant,
  type RoomSocket,
  type RoomSocketStatus,
} from '@lib/rooms';
import { Button } from '@ui/button';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import { CollaborativeEditor } from './collaborative-editor';

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
      <Box width="$full" flexDirection="column" gap={16}>
        <Box
          width="$full"
          backgroundColor="$cardBg"
          border="1px solid"
          borderColor="$border"
          borderRadius={24}
          paddingTop={16}
          paddingRight={18}
          paddingBottom={16}
          paddingLeft={18}
          justifyContent="space-between"
          alignItems="center"
        >
          <Box alignItems="center" gap={10}>
            <RoomCodeBadge
              code={room.code}
              isCopied={isRoomCodeCopied}
              onCopy={handleCopyRoomCode}
            />
            <Text color="$secondaryText" font="$footer" size={14} lineHeight="18px">
              {room.name}
            </Text>
          </Box>

          <div
            ref={participantsMenuRef}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <ConnectionBadge status={socketStatus} />

            {isOwner ? (
              <Button
                type="button"
                variant="ghost"
                height={44}
                minWidth={44}
                padding={12}
                border="1px solid"
                borderColor="#D14343"
                borderRadius={16}
                textColor="#FFB4B4"
                bg="$mainCards"
                disabled={isDeletingRoom}
                onClick={confirmDeleteRoom}
              >
                <Text color="#FFB4B4" font="$footer" size={14} lineHeight="18px">
                  {isDeletingRoom ? 'Удаление...' : 'Удалить комнату'}
                </Text>
              </Button>
            ) : null}

            <Button
              type="button"
              variant="ghost"
              height={44}
              minWidth={44}
              padding={12}
              border="1px solid"
              borderColor="$border"
              borderRadius={16}
              textColor="#FFFFFF"
              bg="$mainCards"
              startIcon={<ParticipantsIcon />}
              onClick={() => {
                setIsParticipantsOpen((current) => !current);
              }}
            >
              <Text color="#FFFFFF" font="$footer" size={14} lineHeight="18px">
                Участники
              </Text>
            </Button>

            {isParticipantsOpen ? (
              <ParticipantsPopover
                roomCode={room.code}
                ownerId={room.owner.id}
                participants={room.users}
                canKick={isOwner}
                removingParticipantId={removingParticipantId}
                onRemoveParticipant={confirmRemoveParticipant}
              />
            ) : null}
          </div>
        </Box>

        {errorMessage ? <InlineErrorMessage message={errorMessage} /> : null}

        <Box
          width="$full"
          minHeight={640}
          gap={16}
          alignItems="stretch"
        >
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
                onClick={() => {
                  setNewFileBaseName(buildNextFileBaseName(room.files));
                  setNewFileLanguage('TYPESCRIPT');
                  setIsCreateFileModalOpen(true);
                }}
            >
                <Text color="#FFFFFF" font="$footer" size={14} lineHeight="18px">
                  {isCreatingFile ? 'Создание...' : '+ Файл'}
                </Text>
              </Button>
            </Box>

            {room.files.length === 0 ? (
              <Box
                backgroundColor="rgba(145, 152, 161, 0.08)"
                border="1px solid"
                borderColor="$border"
                borderRadius={20}
                padding={16}
              >
                <Text color="$secondaryText" font="$footer" size={14} lineHeight="20px">
                  В комнате пока нет файлов. Создай первый файл и он сразу
                  подключится к collaborative editor.
                </Text>
              </Box>
            ) : (
              <Box flexDirection="column" gap={10}>
                {room.files.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    isActive={file.id === selectedFile?.id}
                    canDelete={isOwner || file.ownerId === user?.id}
                    isDeleting={deletingFileId === file.id}
                    onClick={() => {
                      setSelectedFileId(file.id);
                    }}
                    onDelete={() => {
                      confirmDeleteFile(file);
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>

          <Box
            minHeight={640}
            backgroundColor="$background"
            border="1px solid"
            borderColor="$border"
            borderRadius={30}
            padding={18}
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
                  description="Создай файл в комнате, и здесь откроется редактор."
                  tone="muted"
                />
              </Box>
            )}
          </Box>
        </Box>
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

function FileCard({
  file,
  isActive,
  canDelete,
  isDeleting,
  onClick,
  onDelete,
}: {
  file: RoomFile;
  isActive: boolean;
  canDelete: boolean;
  isDeleting: boolean;
  onClick: () => void;
  onDelete: () => void;
}): ReactNode {
  return (
    <Box
      width="$full"
      position="relative"
    >
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

function CreateFileModal({
  fileName,
  fileExtension,
  language,
  isLoading,
  onNameChange,
  onLanguageChange,
  onCancel,
  onConfirm,
}: {
  fileName: string;
  fileExtension: string;
  language: RoomFile['language'];
  isLoading: boolean;
  onNameChange: (value: string) => void;
  onLanguageChange: (value: RoomFile['language']) => void;
  onCancel: () => void;
  onConfirm: () => void;
}): ReactNode {
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
        maxWidth={520}
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
            Создать файл
          </Text>
          <Text color="$secondaryText" font="$footer" size={16} lineHeight="22px">
            Выберите название и тип файла для комнаты.
          </Text>
        </Box>

        <Box flexDirection="column" gap={8}>
          <Text color="#FFFFFF" font="$footer" size={14} lineHeight="18px">
            Название файла
          </Text>
          <Box alignItems="center" gap={8}>
            <input
              value={fileName}
              onChange={(event) => {
                onNameChange(stripFileExtension(event.target.value));
              }}
              placeholder="Например, main"
              style={{
                ...getModalFieldStyles(),
                flex: 1,
              }}
            />
            <Box
              minWidth={72}
              height={48}
              border="1px solid"
              borderColor="$border"
              borderRadius={16}
              alignItems="center"
              justifyContent="center"
              paddingLeft={12}
              paddingRight={12}
              backgroundColor="#151B23"
            >
              <Text color="$secondaryText" font="$footer" size={14} lineHeight="18px">
                {fileExtension || 'none'}
              </Text>
            </Box>
          </Box>
        </Box>

        <Box flexDirection="column" gap={8}>
          <Text color="#FFFFFF" font="$footer" size={14} lineHeight="18px">
            Тип файла
          </Text>
          <select
            value={language}
            onChange={(event) => {
              onLanguageChange(event.target.value as RoomFile['language']);
            }}
            style={getModalFieldStyles()}
          >
            {FILE_LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
            variant="filled"
            height={44}
            padding={18}
            borderRadius={16}
            bg="#43953D"
            textColor="#FFFFFF"
            disabled={isLoading}
            onClick={onConfirm}
          >
            <Text color="#FFFFFF" font="$footer" size={14} lineHeight="18px">
              {isLoading ? 'Создание...' : 'Создать'}
            </Text>
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

function RoomStateShell({ children }: { children: ReactNode }): ReactNode {
  return (
    <Box width="$full" minHeight="$full" alignItems="center" justifyContent="center">
      <Box width="$full" maxWidth={640}>{children}</Box>
    </Box>
  );
}

function StatusCard({
  title,
  description,
  tone,
}: {
  title: string;
  description: string;
  tone: 'error' | 'muted';
}): ReactNode {
  return (
    <Box
      width="$full"
      backgroundColor="$cardBg"
      border="1px solid"
      borderColor={tone === 'error' ? '#D14343' : '$border'}
      borderRadius={30}
      padding={24}
      flexDirection="column"
      gap={10}
      alignItems="center"
    >
      <Text color="#FFFFFF" font="$rus" size={24} lineHeight="30px" textAlign="center">
        {title}
      </Text>
      <Text
        color={tone === 'error' ? '#FFB4B4' : '$secondaryText'}
        font="$footer"
        size={16}
        lineHeight="22px"
        textAlign="center"
      >
        {description}
      </Text>
    </Box>
  );
}

function InlineErrorMessage({ message }: { message: string }): ReactNode {
  return (
    <Box
      width="$full"
      backgroundColor="rgba(209, 67, 67, 0.12)"
      border="1px solid"
      borderColor="#D14343"
      borderRadius={20}
      paddingTop={12}
      paddingRight={16}
      paddingBottom={12}
      paddingLeft={16}
    >
      <Text color="#FFB4B4" font="$footer" size={14} lineHeight="20px">
        {message}
      </Text>
    </Box>
  );
}

function ConfirmModal({
  title,
  description,
  isLoading,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  isLoading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}): ReactNode {
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

function RoomCodeBadge({
  code,
  isCopied,
  onCopy,
}: {
  code: string;
  isCopied: boolean;
  onCopy: () => void;
}): ReactNode {
  return (
    <Box
      backgroundColor="$mainCards"
      border="1px solid"
      borderColor="$border"
      borderRadius={16}
      paddingTop={10}
      paddingRight={14}
      paddingBottom={10}
      paddingLeft={14}
      alignItems="center"
      gap={8}
    >
      <Text color="$secondaryText" font="$footer" size={13} lineHeight="18px">
        Код комнаты
      </Text>
      <Text color="#FFFFFF" font="$rus" size={16} lineHeight="20px">
        {code}
      </Text>
      <Button
        type="button"
        variant="ghost"
        width={38}
        height={40}
        minWidth={38}
        minHeight={40}
        padding={0}
        border="1px solid"
        borderColor={isCopied ? '#43953D' : '$border'}
        borderRadius={12}
        textColor="#FFFFFF"
        bg="transparent"
        onClick={onCopy}
        aria-label={isCopied ? 'Код комнаты скопирован' : 'Скопировать код комнаты'}
      >
        <CopyRoomCodeIcon />
      </Button>
      {isCopied ? (
        <Text color="#B7F3B3" font="$footer" size={12} lineHeight="16px">
          Скопировано
        </Text>
      ) : null}
    </Box>
  );
}

function CopyRoomCodeIcon(): ReactNode {
  return (
    <svg width="20" height="20" viewBox="0 0 38 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 29.2188V1.71875L1.875 0H26.25L28.125 1.71875V8.59375H35.625L37.5 10.3125V37.8125L35.625 39.5312H11.25L9.375 37.8125V30.9375H1.875L0 29.2188ZM9.375 27.5V10.3125L11.25 8.59375H24.375V3.4375H3.75V27.5H9.375ZM33.75 12.0312H13.125V36.0938H33.75V12.0312Z"
        fill="white"
      />
    </svg>
  );
}

function ParticipantsPopover({
  roomCode,
  ownerId,
  participants,
  canKick,
  removingParticipantId,
  onRemoveParticipant,
}: {
  roomCode: string;
  ownerId: string;
  participants: RoomParticipant[];
  canKick: boolean;
  removingParticipantId: string | null;
  onRemoveParticipant: (participant: RoomParticipant) => void;
}): ReactNode {
  return (
    <Box
      position="absolute"
      zIndex={10}
      style={{ top: 'calc(100% + 12px)', right: 0 }}
      width={360}
      backgroundColor="$cardBg"
      border="1px solid"
      borderColor="$border"
      borderRadius={24}
      padding={18}
      flexDirection="column"
      gap={14}
      shadow="$md"
    >
      <Box flexDirection="column" gap={6}>
        <Text color="$secondaryText" font="$footer" size={13} lineHeight="18px">
          Код комнаты
        </Text>
        <Text color="#FFFFFF" font="$rus" size={24} lineHeight="28px">
          {roomCode}
        </Text>
      </Box>

      <Box flexDirection="column" gap={10}>
        {participants.map((participant) => (
          <ParticipantMenuItem
            key={participant.id}
            participant={participant}
            isOwner={participant.id === ownerId}
            canKick={canKick && participant.id !== ownerId}
            isRemoving={removingParticipantId === participant.id}
            onRemoveParticipant={onRemoveParticipant}
          />
        ))}
      </Box>
    </Box>
  );
}

function ParticipantMenuItem({
  participant,
  isOwner,
  canKick,
  isRemoving,
  onRemoveParticipant,
}: {
  participant: RoomParticipant;
  isOwner: boolean;
  canKick: boolean;
  isRemoving: boolean;
  onRemoveParticipant: (participant: RoomParticipant) => void;
}): ReactNode {
  return (
    <Box
      width="$full"
      backgroundColor="#1A1F26"
      border="1px solid"
      borderColor="$border"
      borderRadius={18}
      padding={14}
      justifyContent="space-between"
      alignItems="center"
      gap={12}
    >
      <Box alignItems="center" gap={12}>
        <Box
          width={38}
          height={38}
          backgroundColor="#FFFFFF"
          borderRadius={12}
          alignItems="center"
          justifyContent="center"
        >
          <Text color="#151B23" font="$rus" size={16} lineHeight="20px">
            {getParticipantInitial(participant)}
          </Text>
        </Box>

        <Box flexDirection="column" gap={4}>
          <Text color="#FFFFFF" font="$footer" size={15} lineHeight="20px">
            {getParticipantName(participant)}
          </Text>
          {isOwner ? (
            <Text color="#43953D" font="$footer" size={12} lineHeight="16px">
              Владелец
            </Text>
          ) : (
            <Text color="$secondaryText" font="$footer" size={12} lineHeight="16px">
              {participant.email}
            </Text>
          )}
        </Box>
      </Box>

      {canKick ? (
        <Button
          type="button"
          variant="ghost"
          width={34}
          height={34}
          minWidth={34}
          minHeight={34}
          padding={0}
          border="1px solid"
          borderColor="#D14343"
          borderRadius={12}
          textColor="#FFB4B4"
          disabled={isRemoving}
          onClick={() => {
            onRemoveParticipant(participant);
          }}
          aria-label={`Удалить участника ${getParticipantName(participant)}`}
        >
          <Text color="#FFB4B4" font="$footer" size={18} lineHeight="18px">
            {isRemoving ? '…' : '−'}
          </Text>
        </Button>
      ) : null}
    </Box>
  );
}

function ConnectionBadge({ status }: { status: RoomSocketStatus }): ReactNode {
  const config = getConnectionStatusConfig(status);

  return (
    <Box
      backgroundColor={config.backgroundColor}
      border="1px solid"
      borderColor={config.borderColor}
      borderRadius={16}
      paddingTop={10}
      paddingRight={14}
      paddingBottom={10}
      paddingLeft={14}
    >
      <Text color={config.textColor} font="$footer" size={14} lineHeight="18px">
        {config.label}
      </Text>
    </Box>
  );
}

function ParticipantsIcon({
  width = 20,
  height = 20,
}: {
  width?: number | string;
  height?: number | string;
}): ReactNode {
  return (
    <svg viewBox="0 0 20 20" width={width} height={height} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16.562548 18H3.4381713c-.7063909 0-1.2280178-.697-0.96159-1.338C3.7127655 13.698 6.6169306 12 9.9998492 12c3.3839393 0 6.2881048 1.698 7.5242888 4.662.266428.641-.255199 1.338-.961589 1.338M5.9166645 6c0-2.206 1.8323291-4 4.0831847-4 2.2518764 0 4.0831847 1.794 4.0831847 4s-1.8313083 4-4.0831847 4c-2.2508556 0-4.0831847-1.794-4.0831847-4m14.0390095 11.636c-.742118-3.359-3.063409-5.838-6.118652-6.963 1.6189828-1.277 2.5632189-3.342 2.2161487-5.603-.4021941-2.623-2.6295714-4.722-5.3183486-5.028C7.0232075-.381 3.8750721 2.449 3.8750721 6c0 1.89.8942175 3.574 2.288625 4.673-3.0562637 1.125-5.3765335 3.604-6.1196731 6.963C-.2254662 18.857.7789973 20 2.0539717 20h15.8917553c1.275995 0 2.2804585-1.143 2.0099478-2.364"
        fill="#FFFFFF"
        fillRule="evenodd"
      />
    </svg>
  );
}

function getConnectionStatusConfig(status: RoomSocketStatus) {
  switch (status) {
    case 'connected':
      return {
        label: 'Подключено',
        backgroundColor: 'rgba(67, 149, 61, 0.12)',
        borderColor: '#43953D',
        textColor: '#B7F3B3',
      };
    case 'connecting':
      return {
        label: 'Подключение...',
        backgroundColor: 'rgba(145, 152, 161, 0.08)',
        borderColor: '#383F47',
        textColor: '#FFFFFF',
      };
    case 'error':
      return {
        label: 'Ошибка подключения',
        backgroundColor: 'rgba(209, 67, 67, 0.12)',
        borderColor: '#D14343',
        textColor: '#FFB4B4',
      };
    default:
      return {
        label: 'Ожидание подключения',
        backgroundColor: 'rgba(145, 152, 161, 0.08)',
        borderColor: '#383F47',
        textColor: '#FFFFFF',
      };
  }
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

function getParticipantInitial(participant: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}) {
  const name = getParticipantName(participant).trim();
  return name.charAt(0).toUpperCase();
}

function buildNextFileBaseName(files: RoomFile[]) {
  const nextIndex = files.length + 1;
  return `main-${nextIndex}`;
}

function getModalFieldStyles() {
  return {
    width: '100%',
    height: 48,
    borderRadius: 16,
    border: '1px solid #383F47',
    background: '#151B23',
    color: '#FFFFFF',
    padding: '0 14px',
    outline: 'none',
    fontSize: '14px',
  } as const;
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

function stripFileExtension(value: string) {
  return value.replace(/\.[^./\\]+$/, '');
}

const FILE_LANGUAGE_OPTIONS: Array<{
  value: RoomFile['language'];
  label: string;
}> = [
  { value: 'TYPESCRIPT', label: 'TypeScript' },
  { value: 'JAVASCRIPT', label: 'JavaScript' },
  { value: 'PYTHON', label: 'Python' },
  { value: 'JSON', label: 'JSON' },
  { value: 'HTML', label: 'HTML' },
  { value: 'CSS', label: 'CSS' },
  { value: 'MARKDOWN', label: 'Markdown' },
  { value: 'PLAINTEXT', label: 'Plain text' },
];
