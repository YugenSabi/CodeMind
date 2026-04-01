import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AssistRoomAiDto } from './dto/assist-room-ai.dto';
import { GenerateAlgorithmTaskDto } from './dto/generate-algorithm-task.dto';
import { ReviewAlgorithmSolutionDto } from './dto/review-algorithm-solution.dto';
import { RoomAiService } from './room-ai.service';

@Controller('rooms/:roomId/ai')
export class RoomAiController {
  constructor(private readonly roomAiService: RoomAiService) {}

  @Get('capabilities')
  getCapabilities(@Req() request: Request, @Param('roomId') roomId: string) {
    return this.roomAiService.getCapabilities(request, roomId);
  }

  @Get('history')
  getHistory(@Req() request: Request, @Param('roomId') roomId: string) {
    return this.roomAiService.getHistory(request, roomId);
  }

  @Post('assist')
  assist(
    @Req() request: Request,
    @Param('roomId') roomId: string,
    @Body() dto: AssistRoomAiDto,
  ) {
    return this.roomAiService.assist(request, roomId, dto);
  }

  @Get('tasks/current')
  getCurrentTask(@Req() request: Request, @Param('roomId') roomId: string) {
    return this.roomAiService.getCurrentAlgorithmTask(request, roomId);
  }

  @Post('tasks/generate')
  generateTask(
    @Req() request: Request,
    @Param('roomId') roomId: string,
    @Body() dto: GenerateAlgorithmTaskDto,
  ) {
    return this.roomAiService.generateAlgorithmTask(request, roomId, dto);
  }

  @Post('tasks/current/review')
  reviewCurrentTask(
    @Req() request: Request,
    @Param('roomId') roomId: string,
    @Body() dto: ReviewAlgorithmSolutionDto,
  ) {
    return this.roomAiService.reviewCurrentAlgorithmSolution(
      request,
      roomId,
      dto,
    );
  }
}
