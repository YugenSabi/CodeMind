import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  createRoom(@Req() request: Request, @Body() dto: CreateRoomDto) {
    return this.roomsService.createRoom(request, dto);
  }

  @Get(':id')
  getRoom(@Req() request: Request, @Param('id') id: string) {
    return this.roomsService.getRoom(request, id);
  }

  @Post('join')
  joinRoom(@Req() request: Request, @Body() dto: JoinRoomDto) {
    return this.roomsService.addUserToRoomByCode(
      request,
      dto.code ?? dto.joinCode ?? '',
    );
  }

  @Get(':id/files')
  getRoomFiles(@Req() request: Request, @Param('id') id: string) {
    return this.roomsService.getRoomFiles(request, id);
  }

  @Get(':id/dashboard')
  getRoomDashboard(@Req() request: Request, @Param('id') id: string) {
    return this.roomsService.getRoomDashboard(request, id);
  }

  @Get(':id/export')
  async exportRoomProject(
    @Req() request: Request,
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    const project = await this.roomsService.exportRoomProject(request, id);
    const encodedFileName = encodeURIComponent(project.fileName);

    response.setHeader('Content-Type', 'application/zip');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${project.fileName}"; filename*=UTF-8''${encodedFileName}`,
    );

    response.send(project.archive);
  }

  @Delete(':id/members/:participantId')
  removeParticipant(
    @Req() request: Request,
    @Param('id') id: string,
    @Param('participantId') participantId: string,
  ) {
    return this.roomsService.removeParticipant(request, id, participantId);
  }

  @Delete(':id')
  deleteRoom(@Req() request: Request, @Param('id') id: string) {
    return this.roomsService.deleteRoom(request, id);
  }
}
