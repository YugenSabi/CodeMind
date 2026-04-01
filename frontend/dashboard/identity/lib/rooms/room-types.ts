import type { RoomDirectory, RoomFile } from '@lib/files';

export type RoomMode = 'JUST_CODING' | 'INTERVIEWS' | 'ALGORITHMS';

export type RoomParticipant = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role?: string;
};

export type Room = {
  id: string;
  code: string;
  name: string;
  mode: RoomMode;
  createdAt: string;
  updatedAt: string;
  owner: RoomParticipant;
  users: RoomParticipant[];
  files: RoomFile[];
  directories: RoomDirectory[];
};

export type RoomDashboardItem = {
  id: string;
  type: 'FILE_CREATED' | 'FILE_UPDATED' | 'FILE_COLLABORATION_JOINED';
  createdAt: string;
  actor: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  file: {
    id: string;
    name: string;
    language: RoomFile['language'];
  };
};

export type CreateRoomPayload = {
  name: string;
  mode: RoomMode;
};

export type JoinRoomPayload = {
  code: string;
};

export type DeleteRoomResponse = {
  success: boolean;
  roomId: string;
};
