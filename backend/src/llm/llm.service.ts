import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export type CodeAssistAction =
  | 'CURSOR_COMPLETE'
  | 'SELECTION_EXPLAIN'
  | 'SELECTION_REVIEW'
  | 'SELECTION_IMPROVE'
  | 'GENERATE_FROM_INSTRUCTION';

type GenerateTextInput = {
  system: string;
  prompt: string;
  temperature?: number;
};

export type GenerateAlgorithmTaskInput = {
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  preferredLanguage: string;
  topic?: string;
};

export type ReviewAlgorithmSolutionInput = {
  title: string;
  problemStatement: string;
  code: string;
  language: string;
};

@Injectable()
export class LlmService {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('LLM_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('LLM_API_KEY is not configured');
    }
    const baseURL = this.configService.get<string>('LLM_API_BASE_URL');
    if (!baseURL) {
      throw new InternalServerErrorException(
        'LLM_API_BASE_URL is not configured',
      );
    }

    this.client = new OpenAI({
      apiKey,
      baseURL,
      timeout: 60_000,
    });

    this.model = this.configService.get<string>('LLM_MODEL') ?? 'grok-4-1';
  }

  async assistWithCode(input: {
    action: CodeAssistAction;
    instruction: string;
    language: string;
    currentCode: string;
    selectedCode?: string;
    cursorPrefix?: string;
    cursorSuffix?: string;
  }): Promise<string> {
    const actionInstructions: Record<CodeAssistAction, string> = {
      CURSOR_COMPLETE:
        'Дополни код ровно в позиции курсора. Верни только код для вставки, без markdown, без пояснений, без вступления.',
      SELECTION_EXPLAIN:
        'Кратко и по делу объясни выделенный код на русском языке. Не добавляй лишнего текста.',
      SELECTION_REVIEW:
        'Сделай краткое code review выделенного кода на русском языке. Укажи баги, риски и улучшения без воды.',
      SELECTION_IMPROVE:
        'Улучши выделенный код. Верни только улучшенный код, без markdown и без пояснений.',
      GENERATE_FROM_INSTRUCTION:
        'Сгенерируй или дополни код по инструкции. Верни только готовый код, без markdown и без пояснений.',
    };

    const prompt = [
      `Language: ${input.language}`,
      `Action: ${input.action}`,
      `Instruction: ${input.instruction}`,
      '',
      input.selectedCode
        ? `Selected code:\n${input.selectedCode}`
        : 'Selected code: <none>',
      '',
      input.cursorPrefix
        ? `Code before cursor:\n${input.cursorPrefix}`
        : 'Code before cursor: <none>',
      '',
      input.cursorSuffix
        ? `Code after cursor:\n${input.cursorSuffix}`
        : 'Code after cursor: <none>',
      '',
      `Full file:\n${input.currentCode}`,
    ].join('\n');

    return this.generateText({
      system: [
        'Ты AI-напарник по программированию внутри совместной комнаты.',
        'Всегда отвечай на русском языке.',
        'Будь точным, кратким и практически полезным.',
        actionInstructions[input.action],
      ].join(' '),
      prompt,
      temperature: 0.3,
    });
  }

  async generateAlgorithmTask(input: GenerateAlgorithmTaskInput) {
    const raw = await this.generateText({
      system: [
        'Ты создаешь оригинальные алгоритмические задачи для практики.',
        'Всегда пиши содержимое задачи на русском языке.',
        'Возвращай только валидный JSON.',
        'Не оборачивай JSON в markdown.',
      ].join(' '),
      prompt: [
        `Difficulty: ${input.difficulty}`,
        `Preferred language: ${input.preferredLanguage}`,
        input.topic ? `Topic: ${input.topic}` : 'Topic: any algorithmic topic',
        '',
        'Return JSON with this exact shape:',
        '{"title":"string","problemStatement":"string","inputFormat":"string","outputFormat":"string","constraints":"string","starterCode":"string","examples":[{"input":"string","output":"string","explanation":"string"}],"hints":["string"],"evaluationCriteria":"string"}',
      ].join('\n'),
      temperature: 0.8,
    });

    return this.parseJson<{
      title: string;
      problemStatement: string;
      inputFormat?: string;
      outputFormat?: string;
      constraints?: string;
      starterCode?: string;
      examples?: Array<{
        input: string;
        output: string;
        explanation?: string;
      }>;
      hints?: string[];
      evaluationCriteria?: string;
    }>(raw);
  }

  async reviewAlgorithmSolution(input: ReviewAlgorithmSolutionInput) {
    const raw = await this.generateText({
      system: [
        'Ты строгий, но полезный интервьюер по алгоритмам.',
        'Всегда формулируй замечания и рекомендации на русском языке.',
        'Возвращай только валидный JSON.',
        'Не оборачивай JSON в markdown.',
      ].join(' '),
      prompt: [
        `Task title: ${input.title}`,
        `Language: ${input.language}`,
        '',
        `Problem statement:\n${input.problemStatement}`,
        '',
        `Candidate solution:\n${input.code}`,
        '',
        'Return JSON with this exact shape:',
        '{"passed":true,"score":0,"summary":"string","strengths":["string"],"issues":["string"],"nextSteps":["string"]}',
      ].join('\n'),
      temperature: 0.2,
    });

    return this.parseJson<{
      passed: boolean;
      score: number;
      summary: string;
      strengths?: string[];
      issues?: string[];
      nextSteps?: string[];
    }>(raw);
  }

  private async generateText({
    system,
    prompt,
    temperature = 0.3,
  }: GenerateTextInput): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: system,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature,
    });

    return completion.choices[0]?.message?.content ?? '';
  }

  private parseJson<T>(raw: string): T {
    const normalized = raw.trim();

    try {
      return JSON.parse(normalized) as T;
    } catch {
      const match = normalized.match(/\{[\s\S]*\}|\[[\s\S]*\]/);

      if (!match) {
        throw new InternalServerErrorException(
          'LLM returned invalid JSON payload',
        );
      }

      try {
        return JSON.parse(match[0]) as T;
      } catch {
        throw new InternalServerErrorException(
          'LLM returned malformed JSON payload',
        );
      }
    }
  }
}
