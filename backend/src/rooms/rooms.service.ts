import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RoomEntity, RoomParticipantEntity } from './entities/room.entity';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async createRoom(ownerId: string, dto: CreateRoomDto) {
    const code = await this.generateUniqueCode();

    const room = await this.prisma.room.create({
      data: {
        code,
        name: dto.name,
        ownerId,
        users: { connect: { id: ownerId } },
      },
      include: { users: true, owner: true },
    });

    return this.toRoomEntity(room);
  }

  async getRoom(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: { users: true, owner: true },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return this.toRoomEntity(room);
  }

  async joinRoomByCode(code: string, userId: string) {
    const room = await this.prisma.room.findUnique({
      where: { code },
      include: { users: true, owner: true },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const isAlreadyMember = room.users.some((user) => user.id === userId);

    if (isAlreadyMember) {
      return this.toRoomEntity(room);
    }

    const updatedRoom = await this.prisma.room.update({
      where: { id: room.id },
      data: {
        users: { connect: { id: userId } },
      },
      include: { users: true, owner: true },
    });

    return this.toRoomEntity(updatedRoom);
  }

  async removeParticipant(
    roomId: string,
    ownerId: string,
    participantId: string,
  ) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: { users: true, owner: true },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.ownerId !== ownerId) {
      throw new ForbiddenException('Only the room owner can remove participants');
    }

    if (participantId === room.ownerId) {
      throw new BadRequestException('Room owner cannot be removed');
    }

    const isParticipant = room.users.some((user) => user.id === participantId);

    if (!isParticipant) {
      throw new NotFoundException('Participant not found in room');
    }

    const updatedRoom = await this.prisma.room.update({
      where: { id: room.id },
      data: {
        users: { disconnect: { id: participantId } },
      },
      include: { users: true, owner: true },
    });

    return this.toRoomEntity(updatedRoom);
  }

  async deleteRoom(roomId: string, ownerId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        ownerId: true,
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.ownerId !== ownerId) {
      throw new ForbiddenException('Only the room owner can delete the room');
    }

    await this.prisma.room.delete({
      where: { id: room.id },
    });

    return {
      success: true,
      roomId,
    };
  }

  private async generateUniqueCode() {
    let code = '';
    let existingRoom: { id: string } | null = null;

    do {
      code = this.generateCode();
      existingRoom = await this.prisma.room.findUnique({
        where: { code },
        select: { id: true },
      });
    } while (existingRoom);

    return code;
  }

  private generateCode() {
    return Math.random().toString(36).slice(2, 10).toUpperCase();
  }

  private toRoomEntity(room: {
    id: string;
    code: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    owner: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
    };
    users: Array<{
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
    }>;
  }): RoomEntity {
    return {
      id: room.id,
      code: room.code,
      name: room.name,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      owner: this.toParticipantEntity(room.owner),
      users: room.users.map((user) => this.toParticipantEntity(user)),
    };
  }

  private toParticipantEntity(user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  }): RoomParticipantEntity {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}
