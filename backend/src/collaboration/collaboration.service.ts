import { Injectable } from '@nestjs/common';
import { FileEventType } from '@prisma/client';
import * as Y from 'yjs';
import { FileEventsService } from '../file-events/file-events.service';
import { FilesService } from '../files/files.service';
import { PrismaService } from '../prisma/prisma.service';
import type {
  AuthenticatedCollaborationContext,
  CollaborationConnectionContext,
} from './collaboration.types';
import { parseFileDocumentName } from './collaboration.utils';

@Injectable()
export class CollaborationService {
  constructor(
    private readonly filesService: FilesService,
    private readonly fileEventsService: FileEventsService,
    private readonly prismaService: PrismaService,
  ) {}

  async authenticateConnection(
    context: CollaborationConnectionContext,
  ): Promise<AuthenticatedCollaborationContext> {
    const { fileId } = parseFileDocumentName(context.documentName);
    const user = await this.filesService.getAuthenticatedUserFromCookie(
      context.headers.cookie,
    );
    const file = await this.filesService.getAccessibleFileById(user, fileId);

    await this.fileEventsService.createEvent({
      fileId: file.id,
      actorId: user.id,
      type: FileEventType.FILE_COLLABORATION_JOINED,
      payload: {
        documentName: context.documentName,
      },
    });

    return {
      fileId: file.id,
      user,
    };
  }

  async loadDocument(documentName: string) {
    const { fileId } = parseFileDocumentName(documentName);
    const document = new Y.Doc();
    const snapshot = await this.prismaService.fileSnapshot.findUnique({
      where: { fileId },
      select: {
        state: true,
      },
    });

    if (snapshot?.state) {
      Y.applyUpdate(document, new Uint8Array(snapshot.state));
    }

    return document;
  }

  async storeDocument(documentName: string, document: Y.Doc) {
    const { fileId } = parseFileDocumentName(documentName);
    const state = Buffer.from(Y.encodeStateAsUpdate(document));

    await this.prismaService.fileSnapshot.upsert({
      where: { fileId },
      update: {
        state,
      },
      create: {
        fileId,
        state,
      },
    });

    await this.prismaService.projectFile.update({
      where: { id: fileId },
      data: {
        updatedAt: new Date(),
      },
    });

    await this.fileEventsService.createEvent({
      fileId,
      type: FileEventType.FILE_SNAPSHOT_STORED,
      payload: {
        bytes: state.length,
      },
    });
  }
}
