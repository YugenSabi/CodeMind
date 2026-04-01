import { IsOptional, IsString, MaxLength } from 'class-validator';

export class MoveDirectoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  parentId?: string | null;
}
