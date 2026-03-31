import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { UserRole } from '@prisma/client';
import type { Request } from 'express';
import { CreateRoomDto } from './dto/create-room.dto';
import { KratosService } from '../kratos/kratos.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kratosService: KratosService,
    private readonly usersService: UsersService,
  ) {}

  async createRoom(request: Request, dto: CreateRoomDto) {
    const user = await this.getAuthenticatedUserFromRequest(request);
    const joinCode = await this.generateUniqueJoinCode();

    const room = await this.prisma.room.create({
      data: {
        name: dto.name.trim(),
        joinCode,
        ownerId: user.id,
        users: { connect: { id: user.id } },
      },
      include: {
        users: true,
        owner: true,
        files: {
          orderBy: {
            updatedAt: 'desc',
          },
        },
      },
    });

    return this.toRoomView(room);
  }

  async getRoom(request: Request, id: string) {
    const user = await this.getAuthenticatedUserFromRequest(request);
    const room = await this.getAccessibleRoomById(user.id, id, user.role);

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
      include: {
        users: true,
        owner: true,
        files: {
          orderBy: {
            updatedAt: 'desc',
          },
        },
      },
    });

    return this.toRoomView(updatedRoom);
  }

  async getRoomFiles(request: Request, roomId: string) {
    const user = await this.getAuthenticatedUserFromRequest(request);
    const room = await this.getAccessibleRoomById(user.id, roomId, user.role);

    return room.files.map((file) => ({
      id: file.id,
      roomId: file.roomId,
      ownerId: file.ownerId,
      name: file.name,
      path: file.path,
      language: file.language,
      documentName: `file:${file.id}`,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
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

    return this.usersService.syncFromKratosIdentity(session.identity);
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
        role: user.role,
      },
    };
  }

  private async getAuthenticatedUserFromRequest(request: Request) {
    const session = await this.kratosService.getSession(request);

    return this.usersService.syncFromKratosIdentity(session.identity);
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
      ownerId: room.ownerId,
      owner: {
        id: room.owner.id,
        email: room.owner.email,
        firstName: room.owner.firstName,
        lastName: room.owner.lastName,
        role: room.owner.role,
      },
      users: room.users.map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      })),
      files: room.files.map((file) => ({
        id: file.id,
        roomId: file.roomId,
        ownerId: file.ownerId,
        name: file.name,
        path: file.path,
        language: file.language,
        documentName: `file:${file.id}`,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
      })),
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
  };
}
