import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { KratosModule } from './kratos/kratos.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { FilesModule } from './files/files.module';
import { FileEventsModule } from './file-events/file-events.module';
import { RoomsModule } from './rooms/rooms.module';
import { CollaborationModule } from './collaboration/collaboration.module';
import { CodeToolsModule } from './code-tools/code-tools.module';
import { LlmModule } from './llm/llm.module';
import { RoomAiModule } from './room-ai/room-ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 200,
      },
    ]),
    PrismaModule,
    KratosModule,
    UsersModule,
    AuthModule,
    HealthModule,
    RoomsModule,
    FilesModule,
    FileEventsModule,
    CollaborationModule,
    CodeToolsModule,
    LlmModule,
    RoomAiModule,
  ],
})
export class AppModule {}
