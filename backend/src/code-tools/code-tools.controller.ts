import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CodeToolsService } from './code-tools.service';
import { RunCodeDto } from './dto/run-code.dto';

@Controller('code-tools')
export class CodeToolsController {
  constructor(private readonly codeToolsService: CodeToolsService) {}

  @Post('run')
  run(@Req() request: Request, @Body() runCodeDto: RunCodeDto) {
    return this.codeToolsService.run(request, runCodeDto);
  }
}
