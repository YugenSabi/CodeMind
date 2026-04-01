import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Sandbox } from '@e2b/code-interpreter';
import { FileLanguage } from '@prisma/client';
import * as path from 'node:path';
import { PrismaService } from '../prisma/prisma.service';
import ts from 'typescript';
import * as Y from 'yjs';

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

type ExecutionPreparationResult = {
  files: Array<{
    path: string;
    data: string;
  }>;
  command: string;
};

type ProjectSourceFile = {
  id: string;
  name: string;
  directoryId: string | null;
  language: FileLanguage;
  content: string;
};

type ProjectExecutionFile = {
  inputPath: string;
  outputPath: string;
  language: FileLanguage;
  content: string;
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
      throw new BadRequestException(
        'File does not belong to the selected room',
      );
    }

    if (input.user.role !== 'ADMIN') {
      const room = await this.prismaService.room.findFirst({
        where: {
          id: roomId,
          OR: [
            { ownerId: input.user.id },
            { users: { some: { id: input.user.id } } },
          ],
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

    const workspaceDir = '/home/user/codemind';
    const executionFiles = await this.prepareExecutionFiles({
      fileId: file.id,
      roomId,
      language: file.language,
      content: input.content,
    });

    await sandbox.files.write(
      executionFiles.files.map((fileToWrite) => ({
        path: `${workspaceDir}/${fileToWrite.path}`,
        data: fileToWrite.data,
      })),
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

    try {
      await session.sandbox.pty.resize(
        session.terminalPid,
        {
          cols: input.cols,
          rows: input.rows,
        },
        { requestTimeoutMs },
      );
    } catch (error) {
      if (this.isProcessNotFoundError(error)) {
        this.sessions.delete(input.roomId);
        await session.sandbox.kill().catch(() => undefined);
        return;
      }

      throw error;
    }
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

  private async prepareExecutionFiles(input: {
    fileId: string;
    roomId: string;
    language: FileLanguage;
    content: string;
  }): Promise<ExecutionPreparationResult> {
    if (input.roomId && RUNNABLE_LANGUAGES.has(input.language)) {
      return this.prepareProjectExecutionFiles(input);
    }

    return this.prepareSingleFileExecution(input.language, input.content);
  }

  private async prepareProjectExecutionFiles(input: {
    fileId: string;
    roomId: string;
    language: FileLanguage;
    content: string;
  }): Promise<ExecutionPreparationResult> {
    const [projectFiles, directories] = await Promise.all([
      this.prismaService.projectFile.findMany({
        where: {
          roomId: input.roomId,
        },
        select: {
          id: true,
          name: true,
          directoryId: true,
          language: true,
          snapshot: {
            select: {
              state: true,
            },
          },
        },
      }),
      this.prismaService.projectDirectory.findMany({
        where: {
          roomId: input.roomId,
        },
        select: {
          id: true,
          name: true,
          parentId: true,
        },
      }),
    ]);

    const directoryPathMap = this.buildDirectoryPathMap(directories);
    const sourceFiles: ProjectSourceFile[] = projectFiles.map((file) => ({
      id: file.id,
      name: file.name,
      directoryId: file.directoryId,
      language: file.language,
      content:
        file.id === input.fileId
          ? input.content
          : this.readSnapshotContent(file.snapshot?.state),
    }));
    const executionFiles = sourceFiles.map((file) =>
      this.buildProjectExecutionFile(file, directoryPathMap),
    );
    const entryFile = executionFiles.find(
      (file) =>
        file.inputPath ===
        this.resolveEntryInputPath(input.fileId, sourceFiles, directoryPathMap),
    );

    if (!entryFile || !RUN_COMMANDS[input.language]) {
      throw new BadRequestException('Entry file was not found in the project');
    }

    return {
      files: executionFiles.map((file) => ({
        path: file.outputPath,
        data: file.content,
      })),
      command: `${RUN_COMMANDS[input.language]} ${this.quoteShellPath(entryFile.outputPath)}`,
    };
  }

  private prepareSingleFileExecution(
    language: FileLanguage,
    content: string,
  ): ExecutionPreparationResult {
    if (language === FileLanguage.TYPESCRIPT) {
      const transpiled = ts.transpileModule(content, {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020,
        },
      });

      return {
        files: [
          {
            path: 'main.js',
            data: transpiled.outputText,
          },
        ],
        command: 'node main.js',
      };
    }

    if (language === FileLanguage.JAVASCRIPT) {
      return {
        files: [
          {
            path: 'main.js',
            data: content,
          },
        ],
        command: 'node main.js',
      };
    }

    if (language === FileLanguage.PYTHON) {
      return {
        files: [
          {
            path: 'main.py',
            data: content,
          },
        ],
        command: 'python -u main.py',
      };
    }

    throw new BadRequestException('This file type is not runnable');
  }

  private buildDirectoryPathMap(
    directories: Array<{
      id: string;
      name: string;
      parentId: string | null;
    }>,
  ) {
    const byId = new Map(
      directories.map((directory) => [directory.id, directory]),
    );
    const pathMap = new Map<string, string>();
    const visiting = new Set<string>();

    const resolvePath = (directoryId: string): string => {
      const cached = pathMap.get(directoryId);
      if (cached) {
        return cached;
      }

      if (visiting.has(directoryId)) {
        throw new BadRequestException('Invalid project directory structure');
      }

      const directory = byId.get(directoryId);
      if (!directory) {
        throw new BadRequestException('Directory was not found');
      }

      visiting.add(directoryId);

      const normalizedName = this.normalizePathSegment(directory.name);
      const resolvedPath = directory.parentId
        ? path.posix.join(resolvePath(directory.parentId), normalizedName)
        : normalizedName;

      visiting.delete(directoryId);
      pathMap.set(directoryId, resolvedPath);

      return resolvedPath;
    };

    for (const directory of directories) {
      resolvePath(directory.id);
    }

    return pathMap;
  }

  private buildFilePath(
    file: {
      name: string;
      directoryId: string | null;
    },
    directoryPathMap: Map<string, string>,
  ) {
    const normalizedName = this.normalizePathSegment(file.name);

    if (!file.directoryId) {
      return normalizedName;
    }

    const directoryPath = directoryPathMap.get(file.directoryId);

    if (!directoryPath) {
      throw new BadRequestException('Directory path was not found');
    }

    return path.posix.join(directoryPath, normalizedName);
  }

  private resolveEntryInputPath(
    fileId: string,
    sourceFiles: ProjectSourceFile[],
    directoryPathMap: Map<string, string>,
  ) {
    const entryFile = sourceFiles.find((file) => file.id === fileId);

    if (!entryFile) {
      throw new BadRequestException('Entry file was not found in the project');
    }

    return this.buildFilePath(entryFile, directoryPathMap);
  }

  private buildProjectExecutionFile(
    file: ProjectSourceFile,
    directoryPathMap: Map<string, string>,
  ): ProjectExecutionFile {
    const inputPath = this.buildFilePath(file, directoryPathMap);

    if (file.language === FileLanguage.TYPESCRIPT) {
      const transpiled = ts.transpileModule(file.content, {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020,
        },
        fileName: inputPath,
      });

      return {
        inputPath,
        outputPath: replaceExtension(inputPath, '.js'),
        language: file.language,
        content: transpiled.outputText,
      };
    }

    return {
      inputPath,
      outputPath: inputPath,
      language: file.language,
      content: file.content,
    };
  }

  private readSnapshotContent(state?: Uint8Array | Buffer | null) {
    if (!state) {
      return '';
    }

    const document = new Y.Doc();

    try {
      Y.applyUpdate(document, new Uint8Array(state));
      const text = document.getText('content');
      return text.toJSON();
    } finally {
      document.destroy();
    }
  }

  private normalizePathSegment(segment: string) {
    return segment.trim().replace(/[\\/]/g, '_');
  }

  private quoteShellPath(filePath: string) {
    return `'${filePath.replace(/'/g, `'\\''`)}'`;
  }

  private resolveE2BError(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return 'E2B terminal execution failed';
  }

  private isProcessNotFoundError(error: unknown) {
    if (!(error instanceof Error)) {
      return false;
    }

    return (
      error.name === 'NotFoundError' ||
      error.message.toLowerCase().includes('process with pid') ||
      error.message.toLowerCase().includes('not found')
    );
  }
}

const RUNNABLE_LANGUAGES = new Set<FileLanguage>([
  FileLanguage.JAVASCRIPT,
  FileLanguage.TYPESCRIPT,
  FileLanguage.PYTHON,
]);

const RUN_COMMANDS: Partial<Record<FileLanguage, string>> = {
  [FileLanguage.JAVASCRIPT]: 'node',
  [FileLanguage.TYPESCRIPT]: 'node',
  [FileLanguage.PYTHON]: 'python -u',
};

function replaceExtension(filePath: string, nextExtension: string) {
  const extension = path.posix.extname(filePath);

  if (!extension) {
    return `${filePath}${nextExtension}`;
  }

  return `${filePath.slice(0, -extension.length)}${nextExtension}`;
}
