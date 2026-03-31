import { Injectable } from '@nestjs/common';
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
    const existingUser = await this.prismaService.user.findUnique({
      where: { kratosIdentityId: identity.id },
    });

    return existingUser
      ? this.prismaService.user.update({
          where: { id: existingUser.id },
          data: {
            email,
            isVerified,
            firstName:
              existingUser.firstName ?? identity.traits?.first_name ?? null,
            lastName:
              existingUser.lastName ?? identity.traits?.last_name ?? null,
          },
        })
      : this.prismaService.user.create({
          data: {
            kratosIdentityId: identity.id,
            email,
            isVerified,
            firstName: identity.traits?.first_name ?? null,
            lastName: identity.traits?.last_name ?? null,
            role: UserRole.USER,
          },
        });
  }

  async getProfileView(userId: string) {
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
