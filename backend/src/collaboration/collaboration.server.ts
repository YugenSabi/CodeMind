import { Server } from '@hocuspocus/server';
import type { CollaborationService } from './collaboration.service';

export function createCollaborationServer(
  collaborationService: CollaborationService,
) {
  const port = Number(process.env.COLLAB_PORT ?? 1234);

  return new Server({
    port,
    async onConnect(data) {
      const context = await collaborationService.authenticateConnection({
        documentName: data.documentName,
        headers: data.requestHeaders,
      });

      console.log('Hocuspocus client connected');
      console.log('documentName:', data.documentName);
      console.log('userId:', context.user.id);
      console.log('fileId:', context.fileId);
    },
    async onLoadDocument(data) {
      return collaborationService.loadDocument(data.documentName);
    },
    async onStoreDocument(data) {
      await collaborationService.storeDocument(
        data.documentName,
        data.document,
      );
    },
  });
}
