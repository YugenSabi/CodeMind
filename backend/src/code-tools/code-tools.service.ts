import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandExitError, Sandbox } from '@e2b/code-interpreter';
import { FileLanguage } from '@prisma/client';
import type { Request } from 'express';
import ts from 'typescript';
import { FilesService } from '../files/files.service';
import { RunCodeDto } from './dto/run-code.dto';

@Injectable()
export class CodeToolsService {
  constructor(
    private readonly filesService: FilesService,
    private readonly configService: ConfigService,
  ) {}

  async run(request: Request, runCodeDto: RunCodeDto) {
    const user = await this.filesService.getAuthenticatedUserFromRequest(request);
    const file = await this.filesService.getAccessibleFileById(
      user,
      runCodeDto.fileId,
    );

    if (!RUNNABLE_LANGUAGES.has(file.language)) {
      throw new BadRequestException('This file type is not runnable');
    }

    return this.runWithE2B(file.language, runCodeDto.content, runCodeDto.stdin);
  }

  private async runWithE2B(
    language: FileLanguage,
    content: string,
    stdin?: string,
  ) {
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

    try {
      const runtimeLanguage = LANGUAGE_MAP[language];

      if (!runtimeLanguage) {
        throw new BadRequestException('This file type is not runnable');
      }

      const workspaceDir = '/home/user/codemind';
      const executionFiles = this.prepareExecutionFiles(language, content, stdin);

      await sandbox.files.write(
        [
          {
            path: `${workspaceDir}/${executionFiles.codeFile.name}`,
            data: executionFiles.codeFile.content,
          },
          {
            path: `${workspaceDir}/stdin.txt`,
            data: executionFiles.stdinContent,
          },
        ],
        { requestTimeoutMs },
      );

      let terminalOutput = '';
      const decoder = new TextDecoder();
      const terminal = await sandbox.pty
        .create({
          cols: 120,
          rows: 32,
          cwd: workspaceDir,
          timeoutMs: runTimeoutMs,
          requestTimeoutMs,
          onData: (chunk) => {
            terminalOutput += decoder.decode(chunk, { stream: true });
          },
        })
        .catch((error) => {
          throw new InternalServerErrorException(this.resolveE2BError(error));
        });

      const command = `${executionFiles.command} < stdin.txt\nexit\n`;
      await sandbox.pty
        .sendInput(terminal.pid, new TextEncoder().encode(command), {
          requestTimeoutMs,
        })
        .catch((error) => {
          throw new InternalServerErrorException(this.resolveE2BError(error));
        });

      let exitCode = 0;
      let stderr = '';

      try {
        await terminal.wait();
      } catch (error) {
        if (error instanceof CommandExitError) {
          exitCode = error.exitCode;
          stderr = error.stderr;
          terminalOutput = error.stdout || terminalOutput;
        } else {
          throw new InternalServerErrorException(this.resolveE2BError(error));
        }
      }

      return {
        language,
        stdout: this.stripTerminalNoise(terminalOutput),
        stderr: stderr.trim(),
        exitCode,
        durationMs: 0,
        timedOut: false,
      };
    } finally {
      await sandbox.kill().catch(() => undefined);
    }
  }

  private resolveE2BError(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return 'E2B execution failed';
  }

  private prepareExecutionFiles(
    language: FileLanguage,
    content: string,
    stdin?: string,
  ) {
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
        stdinContent: stdin ?? '',
      };
    }

    if (language === FileLanguage.JAVASCRIPT) {
      return {
        codeFile: {
          name: 'main.js',
          content,
        },
        command: 'node main.js',
        stdinContent: stdin ?? '',
      };
    }

    if (language === FileLanguage.PYTHON) {
      return {
        codeFile: {
          name: 'main.py',
          content,
        },
        command: 'python -u main.py',
        stdinContent: stdin ?? '',
      };
    }

    throw new BadRequestException('This file type is not runnable');
  }

  private stripTerminalNoise(output: string) {
    return output
      .replace(/\u001b\[[0-9;]*[A-Za-z]/g, '')
      .replace(/\r/g, '')
      .trim();
  }
}

const RUNNABLE_LANGUAGES = new Set<FileLanguage>([
  FileLanguage.JAVASCRIPT,
  FileLanguage.TYPESCRIPT,
  FileLanguage.PYTHON,
]);

const LANGUAGE_MAP: Partial<
  Record<FileLanguage, 'javascript' | 'typescript' | 'python'>
> = {
  [FileLanguage.JAVASCRIPT]: 'javascript',
  [FileLanguage.TYPESCRIPT]: 'typescript',
  [FileLanguage.PYTHON]: 'python',
};
