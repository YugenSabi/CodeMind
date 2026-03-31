import type { User } from '@prisma/client';
import type { IncomingHttpHeaders } from 'http';

export type CollaborationConnectionContext = {
  documentName: string;
  headers: IncomingHttpHeaders;
};

export type AuthenticatedCollaborationContext = {
  fileId: string;
  user: User;
};
