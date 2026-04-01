import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileLanguage } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateFileDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  path?: string | null;

  @ApiPropertyOptional({ enum: FileLanguage })
  @IsOptional()
  @IsEnum(FileLanguage)
  language?: FileLanguage;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  roomId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  directoryId?: string | null;
}
