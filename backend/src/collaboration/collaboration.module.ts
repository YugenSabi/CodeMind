import { Module } from '@nestjs/common';
import { FileEventsModule } from '../file-events/file-events.module';
import { FilesModule } from '../files/files.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CollaborationService } from './collaboration.service';

@Module({
  imports: [FilesModule, FileEventsModule, PrismaModule],
  providers: [CollaborationService],
  exports: [CollaborationService],
})
export class CollaborationModule {}
