import { Injectable } from '@nestjs/common';
import { FileEventType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListFileEventsQueryDto } from './dto/list-file-events-query.dto';

@Injectable()
export class FileEventsService {
  constructor(private readonly prismaService: PrismaService) {}

  async createEvent(input: {
    fileId: string;
    actorId?: string | null;
    type: FileEventType;
    payload?: Prisma.InputJsonValue;
  }) {
    return this.prismaService.fileEvent.create({
      data: {
        fileId: input.fileId,
        actorId: input.actorId ?? null,
        type: input.type,
        payload: input.payload,
      },
    });
  }

  async listForFile(fileId: string, query: ListFileEventsQueryDto) {
    return this.prismaService.fileEvent.findMany({
      where: { fileId },
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: query.limit ?? 50,
    });
  }
}
