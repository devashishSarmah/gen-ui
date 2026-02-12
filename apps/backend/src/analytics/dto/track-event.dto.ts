import { IsString, IsNotEmpty, IsOptional, IsObject, MaxLength, IsIn } from 'class-validator';

export class TrackEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  eventName!: string;

  @IsString()
  @IsIn(['auth', 'conversation', 'navigation', 'engagement'])
  category!: string;

  @IsObject()
  @IsOptional()
  properties?: Record<string, any>;

  @IsString()
  @IsOptional()
  sessionId?: string;

  @IsString()
  @IsOptional()
  pageUrl?: string;
}
