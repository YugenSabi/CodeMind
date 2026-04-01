import { type ReactNode } from 'react';
import type { Room, RoomParticipant, RoomSocketStatus } from '@lib/rooms';
import { Button } from '@ui/button';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import {
  ConnectionBadge,
  ParticipantsIcon,
  ParticipantsPopover,
} from '../participants-popover/component';
import { RoomCodeBadge } from '../room-code-badge/component';

type RoomToolbarProps = {
  room: Room;
  socketStatus: RoomSocketStatus;
  isOwner: boolean;
  isDeletingRoom: boolean;
  isParticipantsOpen: boolean;
  removingParticipantId: string | null;
  isRoomCodeCopied: boolean;
  participantsMenuRef: { current: HTMLDivElement | null };
  onCopyRoomCode: () => void;
  onDeleteRoom: () => void;
  onToggleParticipants: () => void;
  onRemoveParticipant: (participant: RoomParticipant) => void;
};

export function RoomToolbar({
  room,
  socketStatus,
  isOwner,
  isDeletingRoom,
  isParticipantsOpen,
  removingParticipantId,
  isRoomCodeCopied,
  participantsMenuRef,
  onCopyRoomCode,
  onDeleteRoom,
  onToggleParticipants,
  onRemoveParticipant,
}: RoomToolbarProps): ReactNode {
  return (
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
          onCopy={onCopyRoomCode}
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
            onClick={onDeleteRoom}
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
          onClick={onToggleParticipants}
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
            onRemoveParticipant={onRemoveParticipant}
          />
        ) : null}
      </div>
    </Box>
  );
}
