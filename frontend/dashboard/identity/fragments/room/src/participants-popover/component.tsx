import { type ReactNode } from 'react';
import type { RoomParticipant, RoomSocketStatus } from '@lib/rooms';
import { Button } from '@ui/button';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';

type ParticipantsPopoverProps = {
  roomCode: string;
  ownerId: string;
  participants: RoomParticipant[];
  canKick: boolean;
  removingParticipantId: string | null;
  onRemoveParticipant: (participant: RoomParticipant) => void;
};

type ConnectionBadgeProps = {
  status: RoomSocketStatus;
};

export function ParticipantsPopover({
  roomCode,
  ownerId,
  participants,
  canKick,
  removingParticipantId,
  onRemoveParticipant,
}: ParticipantsPopoverProps): ReactNode {
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

export function ConnectionBadge({ status }: ConnectionBadgeProps): ReactNode {
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

export function ParticipantsIcon({
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
