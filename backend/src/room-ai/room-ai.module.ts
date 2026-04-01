import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { LlmModule } from '../llm/llm.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RoomsModule } from '../rooms/rooms.module';
import { RoomAiController } from './room-ai.controller';
import { RoomAiService } from './room-ai.service';

@Module({
  imports: [PrismaModule, RoomsModule, FilesModule, LlmModule],
  controllers: [RoomAiController],
  providers: [RoomAiService],
})
export class RoomAiModule {}
