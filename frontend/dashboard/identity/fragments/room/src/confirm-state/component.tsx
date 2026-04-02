'use client';

import { type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ConfirmModal } from '../confirm-modal/component';
import { getParticipantName } from '../helpers';
import type { ConfirmState } from '../types';

type RoomConfirmStateProps = {
  confirmState: ConfirmState;
  isDeletingRoom: boolean;
  removingParticipantId: string | null;
  deletingFileId: string | null;
  deletingDirectoryId: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function RoomConfirmState({
  confirmState,
  isDeletingRoom,
  removingParticipantId,
  deletingFileId,
  deletingDirectoryId,
  onCancel,
  onConfirm,
}: RoomConfirmStateProps): ReactNode {
  const t = useTranslations('room');

  if (!confirmState) {
    return null;
  }

  return (
    <ConfirmModal
      title={
        confirmState.type === 'delete-room'
          ? t('confirm.deleteRoomTitle')
          : confirmState.type === 'delete-file'
            ? t('confirm.deleteFileTitle')
            : confirmState.type === 'delete-directory'
              ? t('confirm.deleteDirectoryTitle')
              : t('confirm.removeParticipantTitle')
      }
      description={
        confirmState.type === 'delete-room'
          ? t('confirm.deleteRoomDescription')
          : confirmState.type === 'delete-file'
            ? t('confirm.deleteFileDescription', {
                name: confirmState.file.name,
              })
            : confirmState.type === 'delete-directory'
              ? t('confirm.deleteDirectoryDescription', {
                  name: confirmState.directory.name,
                })
              : t('confirm.removeParticipantDescription', {
                  name: getParticipantName(confirmState.participant),
                })
      }
      isLoading={
        confirmState.type === 'delete-room'
          ? isDeletingRoom
          : confirmState.type === 'delete-file'
            ? deletingFileId === confirmState.file.id
            : confirmState.type === 'delete-directory'
              ? deletingDirectoryId === confirmState.directory.id
              : removingParticipantId === confirmState.participant.id
      }
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
