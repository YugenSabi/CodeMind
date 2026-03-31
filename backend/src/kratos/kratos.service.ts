import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import type { KratosWhoAmIResponse } from './kratos.types';

@Injectable()
export class KratosService {
  private readonly kratosPublicUrl =
    process.env.KRATOS_PUBLIC_URL ?? 'http://localhost:4433';

  async getSession(request: Request): Promise<KratosWhoAmIResponse> {
    const cookie = request.headers.cookie;

    if (!cookie) {
      throw new UnauthorizedException('No session cookie provided');
    }

    const response = await fetch(`${this.kratosPublicUrl}/sessions/whoami`, {
      method: 'GET',
      headers: {
        cookie,
      },
    });

    if (!response.ok) {
      throw new UnauthorizedException('Session is invalid');
    }

    return response.json() as Promise<KratosWhoAmIResponse>;
  }
}
