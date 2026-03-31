export class RoomParticipantEntity {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export class RoomEntity {
  id: string;
  code: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  owner: RoomParticipantEntity;
  users: RoomParticipantEntity[];
}
