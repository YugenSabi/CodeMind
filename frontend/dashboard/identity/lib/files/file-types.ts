export type RoomFile = {
  id: string;
  roomId: string | null;
  directoryId: string | null;
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
  directoryId?: string | null;
  language?: RoomFile['language'];
};

export type RoomDirectory = {
  id: string;
  roomId: string;
  parentId: string | null;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateDirectoryPayload = {
  roomId: string;
  name: string;
  parentId?: string | null;
};
