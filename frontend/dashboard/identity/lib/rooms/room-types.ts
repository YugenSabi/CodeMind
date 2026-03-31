export type RoomParticipant = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

export type Room = {
  id: string;
  code: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  owner: RoomParticipant;
  users: RoomParticipant[];
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
