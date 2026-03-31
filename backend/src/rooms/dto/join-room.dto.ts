import { IsOptional, IsString, Length } from 'class-validator';

export class JoinRoomDto {
  @IsOptional()
  @IsString()
  @Length(8, 8)
  code?: string;

  @IsOptional()
  @IsString()
  @Length(8, 8)
  joinCode?: string;
}
