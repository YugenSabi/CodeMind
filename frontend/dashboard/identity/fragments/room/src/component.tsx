'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthSession } from '@lib/auth';
import {
  connectRoomSocket,
  deleteRoom,
  disconnectRoomSocket,
  getRoom,
  joinRoomSocket,
  removeRoomParticipant,
  type Room,
  type RoomParticipant,
  type RoomSocketStatus,
} from '@lib/rooms';
import { Button } from '@ui/button';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';

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
  | null;

export function RoomComponent({ roomId }: RoomComponentProps): ReactNode {
  const router = useRouter();
  const { user } = useAuthSession();
  const [room, setRoom] = useState<Room | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [socketStatus, setSocketStatus] = useState<RoomSocketStatus>('idle');
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isDeletingRoom, setIsDeletingRoom] = useState(false);
  const [removingParticipantId, setRemovingParticipantId] = useState<string | null>(
    null,
  );
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const participantsMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRoom() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const nextRoom = await getRoom(roomId);

        if (!cancelled) {
          setRoom(nextRoom);
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
    if (!room || !user) {
      setSocketStatus('idle');
      return;
    }

    const socket = connectRoomSocket();
    setSocketStatus('connecting');

    socket.on('connect', () => {
      joinRoomSocket(socket, {
        roomId: room.id,
        userId: user.id,
      });
      setSocketStatus('connected');
    });

    socket.on('connect_error', () => {
      setSocketStatus('error');
    });

    socket.on('disconnect', () => {
      setSocketStatus('idle');
    });

    return () => {
      disconnectRoomSocket(socket);
    };
  }, [room, user]);

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

  const isOwner = Boolean(user && room && user.id === room.owner.id);

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
            <RoomCodeBadge code={room.code} />
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
          height="$full"
          backgroundColor="$background"
          border="1px solid"
          borderColor="$border"
          borderRadius={30}
          padding={18}
        />
      </Box>

      {confirmState ? (
        <ConfirmModal
          title={
            confirmState.type === 'delete-room'
              ? 'Удалить комнату'
              : 'Удалить участника'
          }
          description={
            confirmState.type === 'delete-room'
              ? 'Вы точно хотите удалить комнату?'
              : `Вы точно хотите удалить участника ${getParticipantName(
                  confirmState.participant,
                )}?`
          }
          isLoading={
            confirmState.type === 'delete-room'
              ? isDeletingRoom
              : removingParticipantId === confirmState.participant.id
          }
          onCancel={() => {
            if (isDeletingRoom || removingParticipantId) {
              return;
            }

            setConfirmState(null);
          }}
          onConfirm={() => {
            void handleConfirmAction();
          }}
        />
      ) : null}
    </>
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

function RoomCodeBadge({ code }: { code: string }): ReactNode {
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
    </Box>
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
