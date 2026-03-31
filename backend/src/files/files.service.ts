import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FileEventType,
  FileLanguage,
  type ProjectFile,
  type UserRole,
  type User,
} from '@prisma/client';
import type { Request } from 'express';
import { FileEventsService } from '../file-events/file-events.service';
import { KratosService } from '../kratos/kratos.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { CreateFileDto } from './dto/create-file.dto';
import { ListFilesQueryDto } from './dto/list-files-query.dto';
import { UpdateFileDto } from './dto/update-file.dto';

@Injectable()
export class FilesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly fileEventsService: FileEventsService,
    private readonly kratosService: KratosService,
    private readonly usersService: UsersService,
  ) {}

  async create(request: Request, createFileDto: CreateFileDto) {
    const user = await this.getAuthenticatedUserFromRequest(request);
    const roomId = this.normalizeOptionalString(createFileDto.roomId);

    if (roomId) {
      await this.ensureRoomAccess(user.id, roomId, user.role);
    }

    const file = await this.prismaService.projectFile.create({
      data: {
        ownerId: user.id,
        roomId,
        name: createFileDto.name.trim(),
        path: this.normalizeOptionalString(createFileDto.path),
        language: createFileDto.language ?? FileLanguage.PLAINTEXT,
      },
    });

    await this.fileEventsService.createEvent({
      fileId: file.id,
      actorId: user.id,
      type: FileEventType.FILE_CREATED,
      payload: {
        name: file.name,
        roomId: file.roomId,
        language: file.language,
      },
    });

    return this.toFileView(file);
  }

  async list(request: Request, query: ListFilesQueryDto) {
    const user = await this.getAuthenticatedUserFromRequest(request);
    const roomId = this.normalizeOptionalString(query.roomId);

    if (roomId) {
      await this.ensureRoomAccess(user.id, roomId, user.role);
    }

    const files = await this.prismaService.projectFile.findMany({
      where: roomId
        ? { roomId }
        : {
            ownerId: user.id,
          },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return files.map((file) => this.toFileView(file));
  }

  async getById(request: Request, fileId: string) {
    const user = await this.getAuthenticatedUserFromRequest(request);
    const file = await this.getAccessibleFileById(user, fileId);

    return this.toFileView(file);
  }

  async update(request: Request, fileId: string, updateFileDto: UpdateFileDto) {
    const user = await this.getAuthenticatedUserFromRequest(request);
    const file = await this.getManageableFileById(user, fileId);

    const updated = await this.prismaService.projectFile.update({
      where: { id: file.id },
      data: {
        name:
          updateFileDto.name === undefined
            ? undefined
            : updateFileDto.name.trim(),
        path: this.normalizeOptionalString(updateFileDto.path),
        language: updateFileDto.language,
      },
    });

    await this.fileEventsService.createEvent({
      fileId: updated.id,
      actorId: user.id,
      type: FileEventType.FILE_UPDATED,
      payload: {
        name: updated.name,
        path: updated.path,
        language: updated.language,
      },
    });

    return this.toFileView(updated);
  }

  async remove(request: Request, fileId: string) {
    const user = await this.getAuthenticatedUserFromRequest(request);
    const file = await this.getManageableFileById(user, fileId);

    await this.prismaService.projectFile.delete({
      where: { id: file.id },
    });

    await this.fileEventsService.createEvent({
      fileId: file.id,
      actorId: user.id,
      type: FileEventType.FILE_DELETED,
      payload: {
        name: file.name,
      },
    });

    return {
      success: true,
    };
  }

  async getAccessibleFileById(user: User, fileId: string) {
    const file = await this.prismaService.projectFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('File was not found');
    }

    if (file.ownerId === user.id || user.role === 'ADMIN') {
      return file;
    }

    if (file.roomId) {
      await this.ensureRoomAccess(user.id, file.roomId, user.role);
      return file;
    }

    throw new ForbiddenException('You do not have access to this file');
  }

  async getManageableFileById(user: User, fileId: string) {
    const file = await this.prismaService.projectFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('File was not found');
    }

    if (file.ownerId !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException(
        'You do not have access to manage this file',
      );
    }

    return file;
  }

  async getAuthenticatedUserFromRequest(request: Request) {
    const session = await this.kratosService.getSession(request);

    return this.usersService.syncFromKratosIdentity(session.identity);
  }

  async getAuthenticatedUserFromCookie(cookie?: string) {
    const session = await this.kratosService.getSessionFromCookie(cookie);

    return this.usersService.syncFromKratosIdentity(session.identity);
  }

  private toFileView(file: ProjectFile) {
    return {
      id: file.id,
      roomId: file.roomId,
      ownerId: file.ownerId,
      name: file.name,
      path: file.path,
      language: file.language,
      documentName: `file:${file.id}`,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    };
  }

  private normalizeOptionalString(value: string | null | undefined) {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  private async ensureRoomAccess(
    userId: string,
    roomId: string,
    role: UserRole,
  ) {
    if (role === 'ADMIN') {
      return;
    }

    const room = await this.prismaService.room.findFirst({
      where: {
        id: roomId,
        OR: [{ ownerId: userId }, { users: { some: { id: userId } } }],
      },
      select: { id: true },
    });

    if (!room) {
      throw new ForbiddenException('You do not have access to this room');
    }
  }
}
