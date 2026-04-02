import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FileLanguage,
  RoomAiInteractionKind,
  RoomMode,
  type RoomAlgorithmTask,
} from '@prisma/client';
import type { Request } from 'express';
import * as Y from 'yjs';
import { CodeAssistAction, LlmService } from '../llm/llm.service';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { RoomsService } from '../rooms/rooms.service';
import { AssistRoomAiDto, RoomAiAssistAction } from './dto/assist-room-ai.dto';
import { GenerateAlgorithmTaskDto } from './dto/generate-algorithm-task.dto';
import { ReviewAlgorithmSolutionDto } from './dto/review-algorithm-solution.dto';

@Injectable()
export class RoomAiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roomsService: RoomsService,
    private readonly filesService: FilesService,
    private readonly llmService: LlmService,
  ) {}

  async getCapabilities(request: Request, roomId: string) {
    const { room } = await this.roomsService.getAccessibleRoomForRequest(
      request,
      roomId,
    );

    return {
      roomId: room.id,
      mode: room.mode,
      aiEnabled: room.mode !== RoomMode.INTERVIEWS,
      canAssistCode: room.mode !== RoomMode.INTERVIEWS,
      canGenerateAlgorithmTasks: room.mode === RoomMode.ALGORITHMS,
      canReviewAlgorithmSolutions: room.mode === RoomMode.ALGORITHMS,
    };
  }

  async getHistory(request: Request, roomId: string) {
    await this.roomsService.getAccessibleRoomForRequest(request, roomId);

    const history = await this.prisma.roomAiInteraction.findMany({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
      take: 30,
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
    });

    return history.map((item) => ({
      id: item.id,
      roomId: item.roomId,
      fileId: item.fileId,
      kind: item.kind,
      prompt: item.prompt,
      response: item.response,
      metadata: item.metadata,
      actor: item.actor,
      createdAt: item.createdAt,
    }));
  }

  async assist(request: Request, roomId: string, dto: AssistRoomAiDto) {
    const { room, user } = await this.roomsService.getAccessibleRoomForRequest(
      request,
      roomId,
    );

    this.ensureAiAllowed(room.mode);

    let fileId: string | null = null;
    if (dto.fileId) {
      const file = await this.filesService.getAccessibleFileById(
        user,
        dto.fileId,
      );

      if (file.roomId !== room.id) {
        throw new ForbiddenException('File does not belong to this room');
      }

      fileId = file.id;
    }

    const response = await this.llmService.assistWithCode({
      action: dto.action as CodeAssistAction,
      instruction: dto.instruction,
      language: this.toLanguageLabel(dto.language),
      currentCode: dto.currentCode,
      selectedCode: dto.selectedCode,
      cursorPrefix: dto.cursorPrefix,
      cursorSuffix: dto.cursorSuffix,
    });

    const interaction = await this.prisma.roomAiInteraction.create({
      data: {
        roomId: room.id,
        fileId,
        actorId: user.id,
        kind: this.mapAssistActionToKind(dto.action),
        prompt: dto.instruction,
        response,
        metadata: {
          language: dto.language,
          hasSelection: Boolean(dto.selectedCode),
          hasCursorContext: Boolean(dto.cursorPrefix || dto.cursorSuffix),
        },
      },
    });

    return {
      id: interaction.id,
      kind: interaction.kind,
      response,
      createdAt: interaction.createdAt,
    };
  }

  async getCurrentAlgorithmTask(request: Request, roomId: string) {
    const { room } = await this.roomsService.getAccessibleRoomForRequest(
      request,
      roomId,
    );

    this.ensureAlgorithmMode(room.mode);

    const task = await this.prisma.roomAlgorithmTask.findFirst({
      where: {
        roomId: room.id,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!task) {
      return null;
    }

    return this.toAlgorithmTaskView(task);
  }

  async generateAlgorithmTask(
    request: Request,
    roomId: string,
    dto: GenerateAlgorithmTaskDto,
  ) {
    const { room, user } = await this.roomsService.getAccessibleRoomForRequest(
      request,
      roomId,
    );

    this.ensureAlgorithmMode(room.mode);

    const generatedTask = await this.llmService.generateAlgorithmTask({
      difficulty: dto.difficulty,
      preferredLanguage: this.toLanguageLabel(
        dto.preferredLanguage ?? FileLanguage.TYPESCRIPT,
      ),
      topic: dto.topic,
    });

    await this.prisma.roomAlgorithmTask.updateMany({
      where: {
        roomId: room.id,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    const task = await this.prisma.roomAlgorithmTask.create({
      data: {
        roomId: room.id,
        createdById: user.id,
        difficulty: dto.difficulty,
        title: generatedTask.title,
        problemStatement: generatedTask.problemStatement,
        inputFormat: generatedTask.inputFormat,
        outputFormat: generatedTask.outputFormat,
        constraints: generatedTask.constraints,
        starterCode: generatedTask.starterCode,
        examples: generatedTask.examples ?? [],
        hints: generatedTask.hints ?? [],
        evaluationCriteria: generatedTask.evaluationCriteria,
        isActive: true,
      },
    });

    await this.prisma.roomAiInteraction.create({
      data: {
        roomId: room.id,
        actorId: user.id,
        kind: RoomAiInteractionKind.ALGORITHM_TASK_GENERATED,
        prompt: dto.topic
          ? `Generate ${dto.difficulty} algorithm task about ${dto.topic}`
          : `Generate ${dto.difficulty} algorithm task`,
        response: JSON.stringify(this.toAlgorithmTaskView(task)),
        metadata: {
          difficulty: dto.difficulty,
          preferredLanguage: dto.preferredLanguage ?? FileLanguage.TYPESCRIPT,
        },
      },
    });

    return this.toAlgorithmTaskView(task);
  }

  async reviewCurrentAlgorithmSolution(
    request: Request,
    roomId: string,
    dto: ReviewAlgorithmSolutionDto,
  ) {
    const { room, user } = await this.roomsService.getAccessibleRoomForRequest(
      request,
      roomId,
    );

    this.ensureAlgorithmMode(room.mode);

    const task = await this.prisma.roomAlgorithmTask.findFirst({
      where: {
        roomId: room.id,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!task) {
      throw new NotFoundException('No active algorithm task found');
    }

    const code = await this.resolveSolutionCode(user, room.id, dto);

    const review = await this.llmService.reviewAlgorithmSolution({
      title: task.title,
      problemStatement: task.problemStatement,
      code,
      language: this.toLanguageLabel(dto.language),
    });

    const interaction = await this.prisma.roomAiInteraction.create({
      data: {
        roomId: room.id,
        fileId: dto.fileId ?? null,
        actorId: user.id,
        kind: RoomAiInteractionKind.ALGORITHM_SOLUTION_REVIEWED,
        prompt: `Review solution for task: ${task.title}`,
        response: JSON.stringify(review),
        metadata: {
          language: dto.language,
          taskId: task.id,
          score: review.score,
          passed: review.passed,
        },
      },
    });

    return {
      id: interaction.id,
      task: this.toAlgorithmTaskView(task),
      review,
      createdAt: interaction.createdAt,
    };
  }

  private ensureAiAllowed(mode: RoomMode) {
    if (mode === RoomMode.INTERVIEWS) {
      throw new ForbiddenException('AI is disabled for interview rooms');
    }
  }

  private ensureAlgorithmMode(mode: RoomMode) {
    if (mode !== RoomMode.ALGORITHMS) {
      throw new ForbiddenException(
        'Algorithm tasks are available only in algorithm rooms',
      );
    }
  }

  private async resolveSolutionCode(
    user: Awaited<ReturnType<FilesService['getAuthenticatedUserFromRequest']>>,
    roomId: string,
    dto: ReviewAlgorithmSolutionDto,
  ) {
    if (dto.solutionCode?.trim()) {
      return dto.solutionCode;
    }

    if (!dto.fileId) {
      throw new BadRequestException(
        'Either solutionCode or fileId must be provided',
      );
    }

    const file = await this.filesService.getAccessibleFileById(
      user,
      dto.fileId,
    );

    if (file.roomId !== roomId) {
      throw new ForbiddenException('File does not belong to this room');
    }

    const snapshot = await this.prisma.fileSnapshot.findUnique({
      where: {
        fileId: file.id,
      },
    });

    if (!snapshot) {
      throw new NotFoundException('No saved snapshot found for this file');
    }

    const document = new Y.Doc();
    Y.applyUpdate(document, new Uint8Array(snapshot.state));

    return document.getText('content').toJSON();
  }

  private mapAssistActionToKind(action: RoomAiAssistAction) {
    const mapping: Record<RoomAiAssistAction, RoomAiInteractionKind> = {
      [RoomAiAssistAction.CURSOR_COMPLETE]:
        RoomAiInteractionKind.CURSOR_COMPLETE,
      [RoomAiAssistAction.SELECTION_EXPLAIN]:
        RoomAiInteractionKind.SELECTION_EXPLAIN,
      [RoomAiAssistAction.SELECTION_REVIEW]:
        RoomAiInteractionKind.SELECTION_REVIEW,
      [RoomAiAssistAction.SELECTION_IMPROVE]:
        RoomAiInteractionKind.SELECTION_IMPROVE,
      [RoomAiAssistAction.GENERATE_FROM_INSTRUCTION]:
        RoomAiInteractionKind.GENERATE_FROM_INSTRUCTION,
    };

    return mapping[action];
  }

  private toLanguageLabel(language: FileLanguage) {
    const labels: Record<FileLanguage, string> = {
      PLAINTEXT: 'Plain text',
      JAVASCRIPT: 'JavaScript',
      TYPESCRIPT: 'TypeScript',
      PYTHON: 'Python',
      JSON: 'JSON',
      HTML: 'HTML',
      CSS: 'CSS',
      MARKDOWN: 'Markdown',
    };

    return labels[language];
  }

  private toAlgorithmTaskView(task: RoomAlgorithmTask) {
    return {
      id: task.id,
      roomId: task.roomId,
      difficulty: task.difficulty,
      title: task.title,
      problemStatement: task.problemStatement,
      inputFormat: task.inputFormat,
      outputFormat: task.outputFormat,
      constraints: task.constraints,
      starterCode: task.starterCode,
      examples: task.examples,
      hints: task.hints,
      evaluationCriteria: task.evaluationCriteria,
      isActive: task.isActive,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }
}
