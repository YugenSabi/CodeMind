import { FileLanguage } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export enum RoomAiAssistAction {
  CURSOR_COMPLETE = 'CURSOR_COMPLETE',
  SELECTION_EXPLAIN = 'SELECTION_EXPLAIN',
  SELECTION_REVIEW = 'SELECTION_REVIEW',
  SELECTION_IMPROVE = 'SELECTION_IMPROVE',
  GENERATE_FROM_INSTRUCTION = 'GENERATE_FROM_INSTRUCTION',
}

export class AssistRoomAiDto {
  @IsEnum(RoomAiAssistAction)
  action: RoomAiAssistAction;

  @IsEnum(FileLanguage)
  language: FileLanguage;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  instruction: string;

  @IsString()
  currentCode: string;

  @IsOptional()
  @IsString()
  fileId?: string;

  @IsOptional()
  @IsString()
  selectedCode?: string;

  @IsOptional()
  @IsString()
  cursorPrefix?: string;

  @IsOptional()
  @IsString()
  cursorSuffix?: string;
}
