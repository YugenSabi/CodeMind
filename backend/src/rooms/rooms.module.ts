import { Module } from '@nestjs/common';
import { KratosModule } from '../kratos/kratos.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { RoomsController } from './rooms.controller';
import { RoomsGateway } from './rooms.gateway';
import { RoomsService } from './rooms.service';
import { TerminalService } from './terminal.service';

@Module({
  imports: [PrismaModule, KratosModule, UsersModule],
  controllers: [RoomsController],
  providers: [RoomsService, RoomsGateway, TerminalService],
  exports: [RoomsService, RoomsGateway, TerminalService],
})
export class RoomsModule {}
