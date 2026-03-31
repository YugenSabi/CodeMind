import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;
}
