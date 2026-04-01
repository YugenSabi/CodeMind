import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDirectoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  roomId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  parentId?: string | null;
}
