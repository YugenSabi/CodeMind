import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { CodeToolsController } from './code-tools.controller';
import { CodeToolsService } from './code-tools.service';

@Module({
  imports: [FilesModule],
  controllers: [CodeToolsController],
  providers: [CodeToolsService],
  exports: [CodeToolsService],
})
export class CodeToolsModule {}
