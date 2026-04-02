import type { RoomDirectory, RoomFile } from '@lib/files';
import type { RoomParticipant } from '@lib/rooms';

export type ConfirmState =
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
  | {
      type: 'delete-directory';
      directory: RoomDirectory;
    }
  | null;
