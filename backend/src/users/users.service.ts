import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { RoomMode, UserRole } from '@prisma/client';
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
          avatarUrl: existingUserByIdentity.avatarUrl ?? null,
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
          avatarUrl: existingUserByEmail.avatarUrl ?? null,
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
          avatarUrl: null,
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
            avatarUrl: concurrentUser.avatarUrl ?? null,
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
    const avatarUrl = this.normalizeOptionalString(updateMeDto.avatarUrl);

    this.validateAvatarUrl(avatarUrl);

    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        firstName: this.normalizeOptionalString(updateMeDto.firstName),
        lastName: this.normalizeOptionalString(updateMeDto.lastName),
        avatarUrl,
      },
    });

    return this.getProfileView(userId);
  }

  async getOwnProfile(userId: string) {
    const user = await this.prismaService.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        ownedRooms: {
          include: {
            _count: {
              select: {
                users: true,
                files: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      ownedRooms: user.ownedRooms.map((room) => ({
        id: room.id,
        name: room.name,
        mode: room.mode,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
        membersCount: room._count.users,
        filesCount: room._count.files,
      })),
    };
  }

  async getPublicProfile(userId: string) {
    const user = await this.prismaService.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        ownedRooms: {
          include: {
            _count: {
              select: {
                users: true,
                files: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      rooms: user.ownedRooms.map((room) => ({
        id: room.id,
        name: room.name,
        mode: room.mode,
        createdAt: room.createdAt,
        membersCount: room._count.users,
        filesCount: room._count.files,
      })),
      stats: {
        roomsCount: user.ownedRooms.length,
        algorithmRoomsCount: user.ownedRooms.filter(
          (room) => room.mode === RoomMode.ALGORITHMS,
        ).length,
      },
    };
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

  private validateAvatarUrl(value: string | null | undefined) {
    if (!value) {
      return;
    }

    const isHttpUrl =
      value.startsWith('http://') || value.startsWith('https://');
    const isImageDataUrl =
      value.startsWith('data:image/') && value.includes(';base64,');

    if (!isHttpUrl && !isImageDataUrl) {
      throw new BadRequestException(
        'Аватар должен быть ссылкой http/https или загруженным изображением',
      );
    }

    if (isImageDataUrl && value.length > 500_000) {
      throw new BadRequestException('Изображение слишком большое для аватарки');
    }
  }
}
