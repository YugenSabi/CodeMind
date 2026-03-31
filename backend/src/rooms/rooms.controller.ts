import { Body, Controller, Delete, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';

@Controller('rooms')
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  async createRoom(@Req() request: Request, @Body() dto: CreateRoomDto) {
    const user = await this.authService.getAuthenticatedUser(request);
    return this.roomsService.createRoom(user.id, dto);
  }

  @Get(':id')
  getRoom(@Param('id') id: string) {
    return this.roomsService.getRoom(id);
  }

  @Post('join')
  async joinRoom(@Req() request: Request, @Body() dto: JoinRoomDto) {
    const user = await this.authService.getAuthenticatedUser(request);
    return this.roomsService.joinRoomByCode(dto.code, user.id);
  }

  @Delete(':id')
  async deleteRoom(@Req() request: Request, @Param('id') id: string) {
    const user = await this.authService.getAuthenticatedUser(request);
    return this.roomsService.deleteRoom(id, user.id);
  }

  @Delete(':id/members/:participantId')
  async removeParticipant(
    @Req() request: Request,
    @Param('id') id: string,
    @Param('participantId') participantId: string,
  ) {
    const user = await this.authService.getAuthenticatedUser(request);
    return this.roomsService.removeParticipant(id, user.id, participantId);
  }
}
