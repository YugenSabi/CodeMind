import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async createRoom(dto: CreateRoomDto & { ownerId: string; }, ownerId: string) {
    return this.prisma.room.create({
      data: {
        name: dto.name,
        ownerId,
        users: { connect: { id: ownerId } },
      },
      include: { users: true },
    });
  }


  async getRoom(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: { users: true, owner: true },
    });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }


  async addUserToRoom(id: string, userId: any) {
    const room = await this.prisma.room.findUnique({ where: { id: id } });
    if (!room) throw new NotFoundException('Room not found');

    return this.prisma.room.update({
      where: { id: id },
      data: {
        users: { connect: { id: userId } },
      },
      include: { users: true },
    });
  
  }
  

}
