import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';


@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  createRoom(@Body() dto: CreateRoomDto & { ownerId: string }) {
    return this.roomsService.createRoom(dto, dto.ownerId);
  }

  @Get(':id')
  getRoom(@Param('id') id: string) {
    return this.roomsService.getRoom(id);
  }

  @Post(':id/join')
  joinRoom(@Param('id') id: string, @Body() dto: JoinRoomDto) {
    return this.roomsService.addUserToRoom(id, dto.userId);
  }

}
