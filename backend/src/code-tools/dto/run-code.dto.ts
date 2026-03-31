import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RunCodeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  fileId!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  stdin?: string;
}
