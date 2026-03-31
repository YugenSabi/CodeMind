import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Sandbox } from '@e2b/code-interpreter';
import { FileLanguage } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import ts from 'typescript';

type TerminalUser = {
  id: string;
  role: string;
};

type TerminalStartInput = {
  roomId: string;
  fileId: string;
  content: string;
  user: TerminalUser;
  onData: (data: string) => void;
  cols?: number;
  rows?: number;
};

type TerminalResizeInput = {
  roomId: string;
  cols: number;
  rows: number;
};

@Injectable()
export class TerminalService {
  private readonly sessions = new Map<
    string,
    {
      sandbox: Sandbox;
      terminalPid: number;
      fileId: string;
    }
  >();

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async startSession(input: TerminalStartInput) {
    const roomId = input.roomId.trim();
    const fileId = input.fileId.trim();

    if (!roomId || !fileId) {
      throw new BadRequestException('roomId and fileId are required');
    }

    const file = await this.prismaService.projectFile.findUnique({
      where: { id: fileId },
    });

    if (!file || file.roomId !== roomId) {
      throw new BadRequestException('File does not belong to the selected room');
    }

    if (input.user.role !== 'ADMIN') {
      const room = await this.prismaService.room.findFirst({
        where: {
          id: roomId,
          OR: [{ ownerId: input.user.id }, { users: { some: { id: input.user.id } } }],
        },
        select: { id: true },
      });

      if (!room) {
        throw new BadRequestException('You do not have access to this room');
      }
    }

    await this.stopSession(roomId);

    const apiKey = this.configService.get<string>('E2B_API_KEY');
    const requestTimeoutMs = Number(
      this.configService.get<string>('E2B_REQUEST_TIMEOUT_MS') ?? 30_000,
    );
    const runTimeoutMs = Number(
      this.configService.get<string>('E2B_RUN_TIMEOUT_MS') ?? 15_000,
    );
    const sandboxTimeoutMs = Number(
      this.configService.get<string>('E2B_SANDBOX_TIMEOUT_MS') ?? 60_000,
    );

    if (!apiKey) {
      throw new InternalServerErrorException(
        'E2B_API_KEY is not configured on the backend',
      );
    }

    const sandbox = await Sandbox.create({
      apiKey,
      timeoutMs: sandboxTimeoutMs,
      requestTimeoutMs,
    }).catch((error) => {
      throw new InternalServerErrorException(this.resolveE2BError(error));
    });

    const executionFiles = this.prepareExecutionFiles(file.language, input.content);
    const workspaceDir = '/home/user/codemind';

    await sandbox.files.write(
      `${workspaceDir}/${executionFiles.codeFile.name}`,
      executionFiles.codeFile.content,
      { requestTimeoutMs },
    );

    const terminal = await sandbox.pty
      .create({
        cols: input.cols ?? 120,
        rows: input.rows ?? 32,
        cwd: workspaceDir,
        timeoutMs: runTimeoutMs,
        requestTimeoutMs,
        onData: (chunk) => {
          input.onData(new TextDecoder().decode(chunk));
        },
      })
      .catch(async (error) => {
        await sandbox.kill().catch(() => undefined);
        throw new InternalServerErrorException(this.resolveE2BError(error));
      });

    this.sessions.set(roomId, {
      sandbox,
      terminalPid: terminal.pid,
      fileId,
    });

    await sandbox.pty
      .sendInput(
        terminal.pid,
        new TextEncoder().encode(`${executionFiles.command}\r`),
        { requestTimeoutMs },
      )
      .catch(async (error) => {
        await this.stopSession(roomId);
        throw new InternalServerErrorException(this.resolveE2BError(error));
      });

    return {
      roomId,
      fileId,
      pid: terminal.pid,
    };
  }

  async sendInput(roomId: string, data: string) {
    const session = this.sessions.get(roomId);

    if (!session) {
      throw new BadRequestException('Terminal session is not running');
    }

    const requestTimeoutMs = Number(
      this.configService.get<string>('E2B_REQUEST_TIMEOUT_MS') ?? 30_000,
    );

    await session.sandbox.pty.sendInput(
      session.terminalPid,
      new TextEncoder().encode(data),
      { requestTimeoutMs },
    );
  }

  async resizeSession(input: TerminalResizeInput) {
    const session = this.sessions.get(input.roomId);

    if (!session) {
      return;
    }

    const requestTimeoutMs = Number(
      this.configService.get<string>('E2B_REQUEST_TIMEOUT_MS') ?? 30_000,
    );

    await session.sandbox.pty.resize(
      session.terminalPid,
      {
        cols: input.cols,
        rows: input.rows,
      },
      { requestTimeoutMs },
    );
  }

  async stopSession(roomId: string) {
    const session = this.sessions.get(roomId);

    if (!session) {
      return false;
    }

    this.sessions.delete(roomId);

    await session.sandbox.kill().catch(() => undefined);
    return true;
  }

  private prepareExecutionFiles(language: FileLanguage, content: string) {
    if (language === FileLanguage.TYPESCRIPT) {
      const transpiled = ts.transpileModule(content, {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020,
        },
      });

      return {
        codeFile: {
          name: 'main.js',
          content: transpiled.outputText,
        },
        command: 'node main.js',
      };
    }

    if (language === FileLanguage.JAVASCRIPT) {
      return {
        codeFile: {
          name: 'main.js',
          content,
        },
        command: 'node main.js',
      };
    }

    if (language === FileLanguage.PYTHON) {
      return {
        codeFile: {
          name: 'main.py',
          content,
        },
        command: 'python -u main.py',
      };
    }

    throw new BadRequestException('This file type is not runnable');
  }

  private resolveE2BError(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return 'E2B terminal execution failed';
  }
}
