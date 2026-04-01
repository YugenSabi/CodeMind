import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { UpdateMeDto } from '../auth/dto/update-me.dto';
import type { KratosWhoAmIResponse } from '../kratos/kratos.types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async syncFromKratosIdentity(identity: KratosWhoAmIResponse['identity']) {
    const email = identity.traits?.email;

    if (!email) {
      throw new Error('Kratos identity does not include email');
    }

    const isVerified = this.resolveVerified(identity, email);
    const existingUserByIdentity = await this.prismaService.user.findUnique({
      where: { kratosIdentityId: identity.id },
    });

    if (existingUserByIdentity) {
      return this.prismaService.user.update({
        where: { id: existingUserByIdentity.id },
        data: {
          email,
          isVerified,
          firstName:
            existingUserByIdentity.firstName ??
            identity.traits?.first_name ??
            null,
          lastName:
            existingUserByIdentity.lastName ??
            identity.traits?.last_name ??
            null,
        },
      });
    }

    const existingUserByEmail = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      return this.prismaService.user.update({
        where: { id: existingUserByEmail.id },
        data: {
          kratosIdentityId: identity.id,
          email,
          isVerified,
          firstName:
            existingUserByEmail.firstName ??
            identity.traits?.first_name ??
            null,
          lastName:
            existingUserByEmail.lastName ?? identity.traits?.last_name ?? null,
        },
      });
    }

    try {
      return await this.prismaService.user.create({
        data: {
          kratosIdentityId: identity.id,
          email,
          isVerified,
          firstName: identity.traits?.first_name ?? null,
          lastName: identity.traits?.last_name ?? null,
          role: UserRole.USER,
        },
      });
    } catch {
      const concurrentUser = await this.prismaService.user.findUnique({
        where: { kratosIdentityId: identity.id },
      });

      if (concurrentUser) {
        return this.prismaService.user.update({
          where: { id: concurrentUser.id },
          data: {
            email,
            isVerified,
            firstName:
              concurrentUser.firstName ?? identity.traits?.first_name ?? null,
            lastName:
              concurrentUser.lastName ?? identity.traits?.last_name ?? null,
          },
        });
      }

      throw new Error('Failed to synchronize user identity');
    }
  }

  async getProfileView(userId: string) {
    return this.prismaService.user.findUniqueOrThrow({
      where: { id: userId },
    });
  }

  findById(userId: string) {
    return this.prismaService.user.findUniqueOrThrow({
      where: { id: userId },
    });
  }

  async updateProfile(userId: string, updateMeDto: UpdateMeDto) {
    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        firstName: this.normalizeOptionalString(updateMeDto.firstName),
        lastName: this.normalizeOptionalString(updateMeDto.lastName),
      },
    });

    return this.getProfileView(userId);
  }

  ensureVerified<T extends { isVerified: boolean }>(user: T) {
    if (!user.isVerified) {
      throw new ForbiddenException({
        code: 'ACCOUNT_NOT_VERIFIED',
        message: 'Подтвердите аккаунт, чтобы продолжить работу',
      });
    }

    return user;
  }

  private resolveVerified(
    identity: KratosWhoAmIResponse['identity'],
    email: string,
  ) {
    return identity.verifiable_addresses?.some(
      (address) => address.value === email && address.verified,
    );
  }

  private normalizeOptionalString(value: string | null | undefined) {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }
}
