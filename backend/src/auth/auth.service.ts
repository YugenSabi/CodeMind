import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { KratosService } from '../kratos/kratos.service';
import { UsersService } from '../users/users.service';
import { UpdateMeDto } from './dto/update-me.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly kratosService: KratosService,
    private readonly usersService: UsersService,
  ) {}

  async getAuthenticatedUser(request: Request) {
    const session = await this.kratosService.getSession(request);
    return this.usersService.syncFromKratosIdentity(session.identity);
  }

  async getMe(request: Request) {
    const session = await this.kratosService.getSession(request);
    const user = await this.usersService.syncFromKratosIdentity(
      session.identity,
    );
    const profile = await this.usersService.getProfileView(user.id);

    return {
      ...profile,
      session: {
        id: session.id,
        active: session.active,
      },
    };
  }

  async updateMe(request: Request, updateMeDto: UpdateMeDto) {
    const session = await this.kratosService.getSession(request);
    const user = await this.usersService.syncFromKratosIdentity(
      session.identity,
    );
    const profile = await this.usersService.updateProfile(user.id, updateMeDto);

    return {
      ...profile,
      session: {
        id: session.id,
        active: session.active,
      },
    };
  }
}
