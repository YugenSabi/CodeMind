import type { RoomMode } from '@lib/rooms';

export type ProfileRoomSummary = {
  id: string;
  name: string;
  mode: RoomMode;
  createdAt: string;
  updatedAt?: string;
  membersCount: number;
  filesCount: number;
};

export type OwnProfile = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
  role: string;
  createdAt: string;
  updatedAt: string;
  ownedRooms: ProfileRoomSummary[];
};

export type PublicProfile = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  rooms: ProfileRoomSummary[];
  stats: {
    roomsCount: number;
    algorithmRoomsCount: number;
  };
};

export type UpdateProfilePayload = {
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
};
