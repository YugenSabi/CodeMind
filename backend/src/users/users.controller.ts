import { Body, Controller, Get, Param, Patch, Req } from '@nestjs/common';
import type { Request } from 'express';
import { KratosService } from '../kratos/kratos.service';
import { UpdateMeDto } from '../auth/dto/update-me.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly kratosService: KratosService,
  ) {}

  @Get('me')
  async getMe(@Req() request: Request) {
    const session = await this.kratosService.getSession(request);
    const user = await this.usersService.syncFromKratosIdentity(
      session.identity,
    );
    const verifiedUser = this.usersService.ensureVerified(user);

    return this.usersService.getOwnProfile(verifiedUser.id);
  }

  @Patch('me')
  async updateMe(@Req() request: Request, @Body() updateMeDto: UpdateMeDto) {
    const session = await this.kratosService.getSession(request);
    const user = await this.usersService.syncFromKratosIdentity(
      session.identity,
    );
    const verifiedUser = this.usersService.ensureVerified(user);

    await this.usersService.updateProfile(verifiedUser.id, updateMeDto);

    return this.usersService.getOwnProfile(verifiedUser.id);
  }

  @Get(':id')
  getPublicProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }
}
