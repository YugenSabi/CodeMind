import { ApiPropertyOptional } from '@nestjs/swagger';
import { FileLanguage } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateFileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  path?: string | null;

  @ApiPropertyOptional({ enum: FileLanguage })
  @IsOptional()
  @IsEnum(FileLanguage)
  language?: FileLanguage;
}
