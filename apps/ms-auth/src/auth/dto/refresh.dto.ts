import { IsString, Length } from 'class-validator';

export class RefreshDto {
  @IsString()
  @Length(10, 200)
  refreshToken: string;
}
