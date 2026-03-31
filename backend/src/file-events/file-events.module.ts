import { forwardRef, Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { FileEventsController } from './file-events.controller';
import { FileEventsService } from './file-events.service';

@Module({
  imports: [forwardRef(() => FilesModule)],
  controllers: [FileEventsController],
  providers: [FileEventsService],
  exports: [FileEventsService],
})
export class FileEventsModule {}
