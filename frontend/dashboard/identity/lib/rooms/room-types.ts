import type { RoomFile } from '@lib/files';

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
  createdAt: string;
  updatedAt: string;
  owner: RoomParticipant;
  users: RoomParticipant[];
  files: RoomFile[];
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
};

export type JoinRoomPayload = {
  code: string;
};

export type DeleteRoomResponse = {
  success: boolean;
  roomId: string;
};
