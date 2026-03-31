import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type {
  KratosVerificationFlowResponse,
  KratosWhoAmIResponse,
} from './kratos.types';

@Injectable()
export class KratosService {
  private readonly kratosPublicUrl =
    process.env.KRATOS_PUBLIC_URL ?? 'http://localhost:4433';

  async getSession(request: Request): Promise<KratosWhoAmIResponse> {
    const cookie = request.headers.cookie;

    return this.getSessionFromCookie(cookie);
  }

  async getSessionFromCookie(cookie?: string): Promise<KratosWhoAmIResponse> {
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

  async resendVerificationCode(cookie?: string) {
    const session = await this.getSessionFromCookie(cookie);
    const email = session.identity.traits?.email;

    if (!email) {
      throw new InternalServerErrorException(
        'Unable to resolve verification email',
      );
    }

    const flowResponse = await fetch(
      `${this.kratosPublicUrl}/self-service/verification/api`,
      {
        method: 'GET',
        headers: this.buildCookieHeaders(cookie),
      },
    );

    if (!flowResponse.ok) {
      throw new InternalServerErrorException(
        'Unable to initialize verification flow',
      );
    }

    const flow = (await flowResponse.json()) as KratosVerificationFlowResponse;

    const submitResponse = await fetch(flow.ui.action, {
      method: 'POST',
      headers: {
        ...this.buildCookieHeaders(cookie),
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email,
        method: 'code',
      }),
    });

    if (!submitResponse.ok) {
      throw new InternalServerErrorException(
        'Unable to resend verification code',
      );
    }

    return {
      success: true,
      email,
    };
  }

  private buildCookieHeaders(cookie?: string) {
    const headers: Record<string, string> = {};

    if (cookie) {
      headers.cookie = cookie;
    }

    return headers;
  }
}
