import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { FilesService } from '../files/files.service';
import { ListFileEventsQueryDto } from './dto/list-file-events-query.dto';
import { FileEventsService } from './file-events.service';

@ApiTags('file-events')
@Controller('file-events')
export class FileEventsController {
  constructor(
    private readonly fileEventsService: FileEventsService,
    private readonly filesService: FilesService,
  ) {}

  @Get('files/:fileId')
  async listForFile(
    @Req() request: Request,
    @Param('fileId') fileId: string,
    @Query() query: ListFileEventsQueryDto,
  ) {
    const user =
      await this.filesService.getAuthenticatedUserFromRequest(request);
    await this.filesService.getAccessibleFileById(user, fileId);

    return this.fileEventsService.listForFile(fileId, query);
  }
}
