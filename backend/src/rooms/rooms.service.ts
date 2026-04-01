import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FileEventType,
  FileLanguage,
  RoomMode,
  type UserRole,
} from '@prisma/client';
import type { Request } from 'express';
import { KratosService } from '../kratos/kratos.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { CreateRoomDto } from './dto/create-room.dto';

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kratosService: KratosService,
    private readonly usersService: UsersService,
  ) {}

  async createRoom(request: Request, dto: CreateRoomDto) {
    const user = await this.getAuthenticatedUserFromRequest(request);
    const ownedRoomsCount = await this.prisma.room.count({
      where: {
        ownerId: user.id,
      },
    });

    if (ownedRoomsCount >= 2) {
      throw new BadRequestException(
        'Можно создать не более двух комнат на один аккаунт',
      );
    }

    const joinCode = await this.generateUniqueJoinCode();

    const room = await this.prisma.room.create({
      data: {
        name: dto.name.trim(),
        joinCode,
        mode: dto.mode,
        ownerId: user.id,
        users: { connect: { id: user.id } },
        ...(dto.mode === RoomMode.ALGORITHMS
          ? {
              files: {
                create: {
                  ownerId: user.id,
                  name: 'solution.ts',
                  language: FileLanguage.TYPESCRIPT,
                },
              },
            }
          : {}),
      },
      include: this.roomInclude,
    });

    return this.toRoomView(room);
  }

  async getRoom(request: Request, id: string) {
    const user = await this.getAuthenticatedUserFromRequest(request);
    const room = await this.getAccessibleRoomById(user.id, id, user.role);

    return this.toRoomView(room);
  }

  async getRoomStateById(roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: this.roomInclude,
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return this.toRoomView(room);
  }

  async addUserToRoomByCode(request: Request, joinCode: string) {
    const user = await this.getAuthenticatedUserFromRequest(request);
    const room = await this.prisma.room.findUnique({
      where: { joinCode: joinCode.trim().toUpperCase() },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const updatedRoom = await this.prisma.room.update({
      where: { id: room.id },
      data: {
        users: { connect: { id: user.id } },
      },
      include: this.roomInclude,
    });

    return this.toRoomView(updatedRoom);
  }

  async getRoomFiles(request: Request, roomId: string) {
    const user = await this.getAuthenticatedUserFromRequest(request);
    const room = await this.getAccessibleRoomById(user.id, roomId, user.role);

    return room.files.map((file) => ({
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
    }));
  }

  async getRoomDashboard(request: Request, roomId: string) {
    const user = await this.getAuthenticatedUserFromRequest(request);
    const room = await this.getAccessibleRoomById(user.id, roomId, user.role);

    const events = await this.prisma.fileEvent.findMany({
      where: {
        file: {
          roomId: room.id,
        },
        type: {
          in: [
            FileEventType.FILE_CREATED,
            FileEventType.FILE_UPDATED,
            FileEventType.FILE_COLLABORATION_JOINED,
          ],
        },
      },
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        file: {
          select: {
            id: true,
            name: true,
            language: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 30,
    });

    return events.map((event) => ({
      id: event.id,
      type: event.type,
      createdAt: event.createdAt,
      actor: event.actor
        ? {
            id: event.actor.id,
            email: event.actor.email,
            firstName: event.actor.firstName,
            lastName: event.actor.lastName,
          }
        : null,
      file: {
        id: event.file.id,
        name: event.file.name,
        language: event.file.language,
      },
    }));
  }

  async removeParticipant(
    request: Request,
    roomId: string,
    participantId: string,
  ) {
    const user = await this.getAuthenticatedUserFromRequest(request);
    const room = await this.getAccessibleRoomById(user.id, roomId, user.role);

    if (user.role !== 'ADMIN' && room.ownerId !== user.id) {
      throw new ForbiddenException(
        'Only the room owner can remove participants',
      );
    }

    if (participantId === room.ownerId) {
      throw new ForbiddenException('Room owner cannot be removed');
    }

    const updatedRoom = await this.prisma.room.update({
      where: { id: room.id },
      data: {
        users: {
          disconnect: { id: participantId },
        },
      },
      include: this.roomInclude,
    });

    return this.toRoomView(updatedRoom);
  }

  async deleteRoom(request: Request, roomId: string) {
    const user = await this.getAuthenticatedUserFromRequest(request);
    const room = await this.getAccessibleRoomById(user.id, roomId, user.role);

    if (user.role !== 'ADMIN' && room.ownerId !== user.id) {
      throw new ForbiddenException('Only the room owner can delete the room');
    }

    await this.prisma.room.delete({
      where: { id: room.id },
    });

    return {
      success: true,
      roomId: room.id,
    };
  }

  async getAuthenticatedUserFromCookie(cookie?: string) {
    const session = await this.kratosService.getSessionFromCookie(cookie);
    const user = await this.usersService.syncFromKratosIdentity(
      session.identity,
    );

    return this.usersService.ensureVerified(user);
  }

  async getRealtimeRoomContext(roomId: string, cookie?: string) {
    const user = await this.getAuthenticatedUserFromCookie(cookie);
    const room = await this.getAccessibleRoomById(user.id, roomId, user.role);

    return {
      roomId: room.id,
      roomName: room.name,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
    };
  }

  async getAccessibleRoomForRequest(request: Request, roomId: string) {
    const user = await this.getAuthenticatedUserFromRequest(request);
    const room = await this.getAccessibleRoomById(user.id, roomId, user.role);

    return { user, room };
  }

  async getAccessibleRoomForUser(
    userId: string,
    roomId: string,
    role: UserRole,
  ) {
    return this.getAccessibleRoomById(userId, roomId, role);
  }

  private async getAuthenticatedUserFromRequest(request: Request) {
    const session = await this.kratosService.getSession(request);
    const user = await this.usersService.syncFromKratosIdentity(
      session.identity,
    );

    return this.usersService.ensureVerified(user);
  }

  private async getAccessibleRoomById(
    userId: string,
    roomId: string,
    role: UserRole,
  ) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: this.roomInclude,
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (role === 'ADMIN') {
      return room;
    }

    const isMember =
      room.ownerId === userId || room.users.some((u) => u.id === userId);
    if (!isMember) {
      throw new ForbiddenException('You do not have access to this room');
    }

    return room;
  }

  private generateJoinCode() {
    return Math.random().toString(36).slice(2, 10).toUpperCase();
  }

  private async generateUniqueJoinCode() {
    for (let index = 0; index < 10; index += 1) {
      const joinCode = this.generateJoinCode();
      const existingRoom = await this.prisma.room.findUnique({
        where: { joinCode },
        select: { id: true },
      });

      if (!existingRoom) {
        return joinCode;
      }
    }

    throw new Error('Unable to generate unique join code');
  }

  private toRoomView(
    room: Awaited<ReturnType<RoomsService['getAccessibleRoomById']>>,
  ) {
    return {
      id: room.id,
      name: room.name,
      code: room.joinCode,
      joinCode: room.joinCode,
      mode: room.mode,
      ownerId: room.ownerId,
      owner: {
        id: room.owner.id,
        email: room.owner.email,
        firstName: room.owner.firstName,
        lastName: room.owner.lastName,
        avatarUrl: room.owner.avatarUrl,
        role: room.owner.role,
      },
      users: room.users.map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        role: user.role,
      })),
      files: room.files.map((file) => ({
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
      })),
      directories: room.directories.map((directory) => ({
        id: directory.id,
        roomId: directory.roomId,
        parentId: directory.parentId,
        name: directory.name,
        createdAt: directory.createdAt,
        updatedAt: directory.updatedAt,
      })),
      activeAlgorithmTask:
        room.algorithmTasks[0] === undefined
          ? null
          : {
              id: room.algorithmTasks[0].id,
              roomId: room.algorithmTasks[0].roomId,
              difficulty: room.algorithmTasks[0].difficulty,
              title: room.algorithmTasks[0].title,
              problemStatement: room.algorithmTasks[0].problemStatement,
              inputFormat: room.algorithmTasks[0].inputFormat,
              outputFormat: room.algorithmTasks[0].outputFormat,
              constraints: room.algorithmTasks[0].constraints,
              starterCode: room.algorithmTasks[0].starterCode,
              examples: room.algorithmTasks[0].examples,
              hints: room.algorithmTasks[0].hints,
              evaluationCriteria: room.algorithmTasks[0].evaluationCriteria,
              isActive: room.algorithmTasks[0].isActive,
              createdAt: room.algorithmTasks[0].createdAt,
              updatedAt: room.algorithmTasks[0].updatedAt,
            },
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  }

  private readonly roomInclude = {
    users: true,
    owner: true,
    files: {
      orderBy: {
        updatedAt: 'desc' as const,
      },
    },
    directories: {
      orderBy: {
        name: 'asc' as const,
      },
    },
    algorithmTasks: {
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc' as const,
      },
      take: 1,
    },
  };
}
