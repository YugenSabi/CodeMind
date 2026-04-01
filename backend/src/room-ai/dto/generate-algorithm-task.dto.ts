import { AlgorithmDifficulty, FileLanguage } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class GenerateAlgorithmTaskDto {
  @IsEnum(AlgorithmDifficulty)
  difficulty: AlgorithmDifficulty;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  topic?: string;

  @IsOptional()
  @IsEnum(FileLanguage)
  preferredLanguage?: FileLanguage;
}
