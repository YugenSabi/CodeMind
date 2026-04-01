import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FileEventType,
  FileLanguage,
  RoomMode,
  type ProjectDirectory,
  type ProjectFile,
  type UserRole,
  type User,
} from '@prisma/client';
import type { Request } from 'express';
import { FileEventsService } from '../file-events/file-events.service';
import { KratosService } from '../kratos/kratos.service';
import { PrismaService } from '../prisma/prisma.service';
import { RoomsGateway } from '../rooms/rooms.gateway';
import { RoomsService } from '../rooms/rooms.service';
import { UsersService } from '../users/users.service';
import { CreateDirectoryDto } from './dto/create-directory.dto';
import { CreateFileDto } from './dto/create-file.dto';
import { ListFilesQueryDto } from './dto/list-files-query.dto';
import { MoveDirectoryDto } from './dto/move-directory.dto';
import { MoveFileDto } from './dto/move-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';

@Injectable()
export class FilesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly fileEventsService: FileEventsService,
    private readonly kratosService: KratosService,
    private readonly usersService: UsersService,
    private readonly roomsGateway: RoomsGateway,
    private readonly roomsService: RoomsService,
  ) {}

  async create(request: Request, createFileDto: CreateFileDto) {
    const user = await this.getAuthenticatedUserFromRequest(request);
    let roomId = this.normalizeOptionalString(createFileDto.roomId);
    const directoryId = this.normalizeOptionalString(createFileDto.directoryId);

    if (roomId) {
      const room = await this.getAccessibleRoomContext(
        user.id,
        roomId,
        user.role,
      );
      this.assertCanManageStructure(user, room);
    }

    if (directoryId) {
      const directory = await this.prismaService.projectDirectory.findUnique({
        where: { id: directoryId },
      });

      if (!directory) {
        throw new NotFoundException('Directory was not found');
      }

      const room = await this.getAccessibleRoomContext(
        user.id,
        directory.roomId,
        user.role,
      );
      this.assertCanManageStructure(user, room);
      roomId = directory.roomId;
    }

    const file = await this.prismaService.projectFile.create({
      data: {
        ownerId: user.id,
        roomId,
        directoryId,
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

    const fileView = this.toFileView(file);

    if (file.roomId) {
      this.roomsGateway.emitFileCreated(file.roomId, fileView);
      await this.broadcastRoomTree(file.roomId);
    }

    return fileView;
  }

  async createDirectory(
    request: Request,
    createDirectoryDto: CreateDirectoryDto,
  ) {
    const user = await this.getAuthenticatedUserFromRequest(request);
    const roomId = createDirectoryDto.roomId.trim();
    const parentId = this.normalizeOptionalString(createDirectoryDto.parentId);

    const room = await this.getAccessibleRoomContext(
      user.id,
      roomId,
      user.role,
    );
    this.assertCanManageStructure(user, room);

    if (parentId) {
      await this.getDirectoryInRoomOrThrow(parentId, roomId);
    }

    const directory = await this.prismaService.projectDirectory.create({
      data: {
        roomId,
        parentId,
        name: createDirectoryDto.name.trim(),
      },
    });

    await this.broadcastRoomTree(roomId);

    return this.toDirectoryView(directory);
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
    if (file.roomId) {
      const room = await this.getAccessibleRoomContext(
        user.id,
        file.roomId,
        user.role,
      );
      this.assertCanManageStructure(user, room);
    }

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

    const fileView = this.toFileView(updated);

    if (updated.roomId) {
      this.roomsGateway.emitFileUpdated(updated.roomId, fileView);
      await this.broadcastRoomTree(updated.roomId);
    }

    return fileView;
  }

  async move(request: Request, fileId: string, moveFileDto: MoveFileDto) {
    const user = await this.getAuthenticatedUserFromRequest(request);
    const file = await this.getAccessibleFileById(user, fileId);

    if (!file.roomId) {
      throw new ForbiddenException('Only room files can be moved');
    }

    const room = await this.getAccessibleRoomContext(
      user.id,
      file.roomId,
      user.role,
    );
    this.assertCanManageStructure(user, room);

    const directoryId = this.normalizeOptionalString(moveFileDto.directoryId);

    if (directoryId) {
      await this.getDirectoryInRoomOrThrow(directoryId, file.roomId);
    }

    const movedFile = await this.prismaService.projectFile.update({
      where: { id: file.id },
      data: {
        directoryId,
      },
    });

    await this.broadcastRoomTree(file.roomId);

    return this.toFileView(movedFile);
  }

  async moveDirectory(
    request: Request,
    directoryId: string,
    moveDirectoryDto: MoveDirectoryDto,
  ) {
    const user = await this.getAuthenticatedUserFromRequest(request);
    const directory = await this.prismaService.projectDirectory.findUnique({
      where: { id: directoryId },
    });

    if (!directory) {
      throw new NotFoundException('Directory was not found');
    }

    const room = await this.getAccessibleRoomContext(
      user.id,
      directory.roomId,
      user.role,
    );
    this.assertCanManageStructure(user, room);

    const parentId = this.normalizeOptionalString(moveDirectoryDto.parentId);

    if (parentId === directory.id) {
      throw new ForbiddenException('Directory cannot be moved into itself');
    }

    if (parentId) {
      const parentDirectory = await this.getDirectoryInRoomOrThrow(
        parentId,
        directory.roomId,
      );

      await this.ensureDirectoryIsNotDescendant(directory, parentDirectory);
    }

    const movedDirectory = await this.prismaService.projectDirectory.update({
      where: { id: directory.id },
      data: {
        parentId,
      },
    });

    await this.broadcastRoomTree(directory.roomId);

    return this.toDirectoryView(movedDirectory);
  }

  async remove(request: Request, fileId: string) {
    const user = await this.getAuthenticatedUserFromRequest(request);
    const file = await this.getManageableFileById(user, fileId);
    if (file.roomId) {
      const room = await this.getAccessibleRoomContext(
        user.id,
        file.roomId,
        user.role,
      );
      this.assertCanManageStructure(user, room);
    }

    const fileRoomId = file.roomId;
    const deletedFileId = file.id;

    if (fileRoomId) {
      this.roomsGateway.emitFileDeleted(fileRoomId, deletedFileId);
    }

    await this.prismaService.projectFile.delete({
      where: { id: file.id },
    });

    if (fileRoomId) {
      await this.broadcastRoomTree(fileRoomId);
    }

    return {
      success: true,
    };
  }

  async removeDirectory(request: Request, directoryId: string) {
    const user = await this.getAuthenticatedUserFromRequest(request);
    const directory = await this.prismaService.projectDirectory.findUnique({
      where: { id: directoryId },
    });

    if (!directory) {
      throw new NotFoundException('Directory was not found');
    }

    const room = await this.getAccessibleRoomContext(
      user.id,
      directory.roomId,
      user.role,
    );
    this.assertCanManageStructure(user, room);

    const descendantDirectoryIds = await this.collectDescendantDirectoryIds(
      directory.id,
    );
    const directoryIdsToDelete = [directory.id, ...descendantDirectoryIds];

    await this.prismaService.$transaction(async (tx) => {
      await tx.projectFile.deleteMany({
        where: {
          roomId: directory.roomId,
          OR: [
            { directoryId: directory.id },
            { directoryId: { in: descendantDirectoryIds } },
          ],
        },
      });

      await tx.projectDirectory.deleteMany({
        where: {
          id: { in: directoryIdsToDelete },
        },
      });
    });

    await this.broadcastRoomTree(directory.roomId);

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
    const user = await this.usersService.syncFromKratosIdentity(
      session.identity,
    );

    return this.usersService.ensureVerified(user);
  }

  async getAuthenticatedUserFromCookie(cookie?: string) {
    const session = await this.kratosService.getSessionFromCookie(cookie);
    const user = await this.usersService.syncFromKratosIdentity(
      session.identity,
    );

    return this.usersService.ensureVerified(user);
  }

  private toFileView(file: ProjectFile) {
    return {
      id: file.id,
      roomId: file.roomId,
      directoryId: file.directoryId,
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

  private async getAccessibleRoomContext(
    userId: string,
    roomId: string,
    role: UserRole,
  ) {
    if (role === 'ADMIN') {
      const room = await this.prismaService.room.findUnique({
        where: { id: roomId },
        select: {
          id: true,
          ownerId: true,
          mode: true,
        },
      });

      if (!room) {
        throw new NotFoundException('Room not found');
      }

      return room;
    }

    const room = await this.prismaService.room.findFirst({
      where: {
        id: roomId,
        OR: [{ ownerId: userId }, { users: { some: { id: userId } } }],
      },
      select: {
        id: true,
        ownerId: true,
        mode: true,
      },
    });

    if (!room) {
      throw new ForbiddenException('You do not have access to this room');
    }

    return room;
  }

  private assertCanManageStructure(
    user: Pick<User, 'id' | 'role'>,
    room: {
      id: string;
      ownerId: string;
      mode: RoomMode;
    },
  ) {
    if (user.role === 'ADMIN') {
      return;
    }

    if (room.mode === RoomMode.JUST_CODING) {
      return;
    }

    if (room.mode === RoomMode.INTERVIEWS && room.ownerId === user.id) {
      return;
    }

    throw new ForbiddenException(
      'Room mode does not allow changing project structure',
    );
  }

  private async getDirectoryInRoomOrThrow(directoryId: string, roomId: string) {
    const directory = await this.prismaService.projectDirectory.findFirst({
      where: {
        id: directoryId,
        roomId,
      },
    });

    if (!directory) {
      throw new NotFoundException('Directory was not found');
    }

    return directory;
  }

  private async ensureDirectoryIsNotDescendant(
    sourceDirectory: ProjectDirectory,
    candidateParent: ProjectDirectory,
  ) {
    let currentParentId = candidateParent.parentId;

    while (currentParentId) {
      if (currentParentId === sourceDirectory.id) {
        throw new ForbiddenException(
          'Directory cannot be moved into a nested child',
        );
      }

      const nextParent = await this.prismaService.projectDirectory.findUnique({
        where: { id: currentParentId },
        select: { parentId: true },
      });

      currentParentId = nextParent?.parentId ?? null;
    }
  }

  private toDirectoryView(directory: ProjectDirectory) {
    return {
      id: directory.id,
      roomId: directory.roomId,
      parentId: directory.parentId,
      name: directory.name,
      createdAt: directory.createdAt,
      updatedAt: directory.updatedAt,
    };
  }

  private async broadcastRoomTree(roomId: string) {
    const room = await this.roomsService.getRoomStateById(roomId);

    this.roomsGateway.emitRoomTreeUpdated(roomId, room);
  }

  private async collectDescendantDirectoryIds(directoryId: string) {
    const descendants: string[] = [];
    const queue = [directoryId];

    while (queue.length > 0) {
      const currentId = queue.shift();

      if (!currentId) {
        continue;
      }

      const children = await this.prismaService.projectDirectory.findMany({
        where: {
          parentId: currentId,
        },
        select: {
          id: true,
        },
      });

      for (const child of children) {
        descendants.push(child.id);
        queue.push(child.id);
      }
    }

    return descendants;
  }
}
