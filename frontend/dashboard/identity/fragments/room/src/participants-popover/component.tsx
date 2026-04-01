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
      width={340}
      backgroundColor="#121720"
      border="1px solid"
      borderColor="rgba(255,255,255,0.08)"
      borderRadius={18}
      padding={14}
      flexDirection="column"
      gap={12}
      shadow="$md"
    >
      <Box
        flexDirection="column"
        gap={4}
        paddingBottom={10}
        borderBottom="1px solid"
        borderColor="rgba(255,255,255,0.06)"
      >
        <Text color="#7D8793" font="$footer" size={11} lineHeight="14px">
          Код комнаты
        </Text>
        <Text color="#FFFFFF" font="$rus" size={20} lineHeight="24px">
          {roomCode}
        </Text>
      </Box>

      <Box flexDirection="column" gap={6}>
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
      borderRadius={8}
      paddingTop={7}
      paddingRight={14}
      paddingBottom={7}
      paddingLeft={14}
    >
      <Text color={config.textColor} font="$footer" size={13} lineHeight="18px">
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
      backgroundColor="#181C24"
      border="1px solid"
      borderColor="rgba(255,255,255,0.06)"
      borderRadius={12}
      paddingTop={10}
      paddingRight={10}
      paddingBottom={10}
      paddingLeft={10}
      justifyContent="space-between"
      alignItems="center"
      gap={10}
    >
      <Box alignItems="center" gap={10}>
        <Button
          type="link"
          href={`/profile/${participant.id}`}
          variant="ghost"
          padding={0}
          bg="transparent"
          textColor="#FFFFFF"
        >
          <Box alignItems="center" gap={10}>
            <Box
              width={32}
              height={32}
              backgroundColor="#202734"
              borderRadius={10}
              alignItems="center"
              justifyContent="center"
              overflow="hidden"
            >
              {participant.avatarUrl ? (
                <img
                  src={participant.avatarUrl}
                  alt={getParticipantName(participant)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Text color="#FFFFFF" font="$rus" size={14} lineHeight="16px">
                  {getParticipantInitial(participant)}
                </Text>
              )}
            </Box>

            <Box flexDirection="column" gap={2}>
              <Text color="#FFFFFF" font="$footer" size={13} lineHeight="16px">
                {getParticipantName(participant)}
              </Text>
              {isOwner ? (
                <Text color="#7BC77A" font="$footer" size={11} lineHeight="14px">
                  Владелец
                </Text>
              ) : (
                <Text color="#7D8793" font="$footer" size={11} lineHeight="14px">
                  {participant.email}
                </Text>
              )}
            </Box>
          </Box>
        </Button>
      </Box>

      {canKick ? (
        <Button
          type="button"
          variant="ghost"
          width={26}
          height={26}
          minWidth={26}
          minHeight={26}
          padding={0}
          borderRadius={8}
          textColor="#B88D8D"
          border="1px solid"
          borderColor="#B88D8D"
          bg="transparent"
          disabled={isRemoving}
          onClick={() => {
            onRemoveParticipant(participant);
          }}
          aria-label={`Удалить участника ${getParticipantName(participant)}`}
        >
          <Text color="#B88D8D" font="$footer" size={18} >
            {isRemoving ? '...' : '−'}
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
