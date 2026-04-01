import { IsOptional, IsString, MaxLength } from 'class-validator';

export class MoveFileDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  directoryId?: string | null;
}
