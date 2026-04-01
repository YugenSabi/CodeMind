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
  activeTab: 'editor' | 'dashboard';
  isOwner: boolean;
  isDeletingRoom: boolean;
  isParticipantsOpen: boolean;
  removingParticipantId: string | null;
  isRoomCodeCopied: boolean;
  participantsMenuRef: { current: HTMLDivElement | null };
  onCopyRoomCode: () => void;
  onSelectTab: (tab: 'editor' | 'dashboard') => void;
  onDeleteRoom: () => void;
  onToggleParticipants: () => void;
  onRemoveParticipant: (participant: RoomParticipant) => void;
};

export function RoomToolbar({
  room,
  socketStatus,
  activeTab,
  isOwner,
  isDeletingRoom,
  isParticipantsOpen,
  removingParticipantId,
  isRoomCodeCopied,
  participantsMenuRef,
  onCopyRoomCode,
  onSelectTab,
  onDeleteRoom,
  onToggleParticipants,
  onRemoveParticipant,
}: RoomToolbarProps): ReactNode {
  return (
    <Box
      width="$full"
      backgroundColor="#121720"
      border="1px solid"
      borderColor="rgba(255,255,255,0.06)"
      borderRadius={18}
      paddingTop={12}
      paddingRight={14}
      paddingBottom={12}
      paddingLeft={14}
      justifyContent="space-between"
      alignItems="center"
    >
      <Box alignItems="center" gap={10}>
        <RoomCodeBadge
          code={room.code}
          isCopied={isRoomCodeCopied}
          onCopy={onCopyRoomCode}
        />
        <Text color="#7D8793" font="$footer" size={13} lineHeight="16px">
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
        <Box
          alignItems="center"
          gap={6}
          backgroundColor="#181C24"
          border="1px solid"
          borderColor="rgba(255,255,255,0.08)"
          borderRadius={10}
          padding={4}
        >
          <Button
            type="button"
            variant="ghost"
            height={28}
            minWidth={28}
            padding={10}
            borderRadius={8}
            textColor="#FFFFFF"
            bg={
              activeTab === 'editor'
                ? 'rgba(255,255,255,0.08)'
                : 'transparent'
            }
            onClick={() => {
              onSelectTab('editor');
            }}
          >
            <Text color="#FFFFFF" font="$footer" size={12} lineHeight="14px">
              Editor
            </Text>
          </Button>

          <Button
            type="button"
            variant="ghost"
            height={28}
            minWidth={28}
            padding={10}
            borderRadius={8}
            textColor="#FFFFFF"
            bg={
              activeTab === 'dashboard'
                ? 'rgba(95,135,255,0.12)'
                : 'transparent'
            }
            onClick={() => {
              onSelectTab('dashboard');
            }}
          >
            <Text color="#FFFFFF" font="$footer" size={12} lineHeight="14px">
              Dashboard
            </Text>
          </Button>
        </Box>

        <ConnectionBadge status={socketStatus} />

        {isOwner ? (
          <Button
            type="button"
            variant="ghost"
            height={36}
            minWidth={36}
            padding={10}
            border="1px solid"
            borderColor="rgba(209,67,67,0.35)"
            borderRadius={10}
            textColor="#D89A9A"
            bg="transparent"
            disabled={isDeletingRoom}
            onClick={onDeleteRoom}
          >
            <Text color="#D89A9A" font="$footer" size={12} lineHeight="14px">
              {isDeletingRoom ? 'Удаление...' : 'Удалить комнату'}
            </Text>
          </Button>
        ) : null}

        <Button
          type="button"
          variant="ghost"
          height={36}
          minWidth={36}
          padding={10}
          border="1px solid"
          borderColor="rgba(255,255,255,0.08)"
          borderRadius={10}
          textColor="#FFFFFF"
          bg="transparent"
          startIcon={<ParticipantsIcon />}
          onClick={onToggleParticipants}
        >
          <Text color="#FFFFFF" font="$footer" size={12} lineHeight="14px">
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
