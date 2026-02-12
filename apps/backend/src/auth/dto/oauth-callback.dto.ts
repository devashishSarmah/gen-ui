import { IsString, IsNotEmpty } from 'class-validator';

export class OAuthCallbackDto {
  @IsString()
  @IsNotEmpty({ message: 'Authorization code is required' })
  code!: string;
}
