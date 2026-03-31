import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RoomsGateway } from './rooms.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [RoomsController],
  providers: [RoomsService, RoomsGateway],
})
export class RoomsModule {}
