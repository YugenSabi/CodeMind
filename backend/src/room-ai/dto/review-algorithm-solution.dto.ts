import { FileLanguage } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ReviewAlgorithmSolutionDto {
  @IsOptional()
  @IsString()
  fileId?: string;

  @IsOptional()
  @IsString()
  solutionCode?: string;

  @IsEnum(FileLanguage)
  language: FileLanguage;
}
