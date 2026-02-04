import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConversationsModule } from '../conversations/conversations.module';
import { StateModule } from '../state/state.module';
import { AIModule } from '../ai/ai.module';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION') || '24h',
        },
      }),
    }),
    ConversationsModule,
    StateModule,
    AIModule,
  ],
  providers: [ChatGateway],
})
export class GatewayModule {}
