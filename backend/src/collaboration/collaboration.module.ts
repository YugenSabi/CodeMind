import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { CollaborationService } from './collaboration.service';

@Module({
  imports: [FilesModule],
  providers: [CollaborationService],
  exports: [CollaborationService],
})
export class CollaborationModule {}
