import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CreateDirectoryDto } from './dto/create-directory.dto';
import { CreateFileDto } from './dto/create-file.dto';
import { ListFilesQueryDto } from './dto/list-files-query.dto';
import { MoveDirectoryDto } from './dto/move-directory.dto';
import { MoveFileDto } from './dto/move-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { FilesService } from './files.service';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  create(@Req() request: Request, @Body() createFileDto: CreateFileDto) {
    return this.filesService.create(request, createFileDto);
  }

  @Post('directories')
  createDirectory(
    @Req() request: Request,
    @Body() createDirectoryDto: CreateDirectoryDto,
  ) {
    return this.filesService.createDirectory(request, createDirectoryDto);
  }

  @Get()
  list(@Req() request: Request, @Query() query: ListFilesQueryDto) {
    return this.filesService.list(request, query);
  }

  @Get(':id')
  getById(@Req() request: Request, @Param('id') id: string) {
    return this.filesService.getById(request, id);
  }

  @Patch(':id')
  update(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() updateFileDto: UpdateFileDto,
  ) {
    return this.filesService.update(request, id, updateFileDto);
  }

  @Patch(':id/move')
  move(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() moveFileDto: MoveFileDto,
  ) {
    return this.filesService.move(request, id, moveFileDto);
  }

  @Patch('directories/:id/move')
  moveDirectory(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() moveDirectoryDto: MoveDirectoryDto,
  ) {
    return this.filesService.moveDirectory(request, id, moveDirectoryDto);
  }

  @Delete(':id')
  remove(@Req() request: Request, @Param('id') id: string) {
    return this.filesService.remove(request, id);
  }
}
