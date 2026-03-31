export type RoomFile = {
  id: string;
  roomId: string | null;
  ownerId: string;
  name: string;
  path: string | null;
  language:
    | 'PLAINTEXT'
    | 'JAVASCRIPT'
    | 'TYPESCRIPT'
    | 'PYTHON'
    | 'JSON'
    | 'HTML'
    | 'CSS'
    | 'MARKDOWN';
  documentName: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateFilePayload = {
  roomId: string;
  name: string;
  path?: string | null;
  language?: RoomFile['language'];
};
