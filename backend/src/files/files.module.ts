import { forwardRef, Module } from '@nestjs/common';
import { FileEventsModule } from '../file-events/file-events.module';
import { KratosModule } from '../kratos/kratos.module';
import { UsersModule } from '../users/users.module';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({
  imports: [KratosModule, UsersModule, forwardRef(() => FileEventsModule)],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
