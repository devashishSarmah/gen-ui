import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { APP_FILTER } from '@nestjs/core';
import {
  User,
  Conversation,
  Message,
  InteractionEvent,
  StateSnapshot,
  AiProviderConfig,
  AnalyticsEvent,
} from '../entities';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { RedisModule } from '../redis/redis.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { StateModule } from '../state/state.module';
import { AIModule } from '../ai/ai.module';
import { GatewayModule } from '../gateway/gateway.module';
import { AdminModule } from '../admin/admin.module';
import { SchedulerModule } from '../scheduler/scheduler.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { CommonModule } from '../common/common.module';
import { GlobalExceptionFilter } from '../common/filters/global-exception.filter';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get('NODE_ENV') === 'production';
        return {
          type: 'postgres',
          host: configService.get('POSTGRES_HOST'),
          port: configService.get<number>('POSTGRES_PORT'),
          username: configService.get('POSTGRES_USER'),
          password: configService.get('POSTGRES_PASSWORD'),
          database: configService.get('POSTGRES_DB'),
          entities: [
            User,
            Conversation,
            Message,
            InteractionEvent,
            StateSnapshot,
            AiProviderConfig,
            AnalyticsEvent,
          ],
          migrations: isProduction ? ['dist/apps/backend/migrations/*.js'] : [],
          migrationsRun: isProduction,
          synchronize: !isProduction,
          logging: !isProduction,
        };
      },
    }),
    TypeOrmModule.forFeature([
      User,
      Conversation,
      Message,
      InteractionEvent,
      StateSnapshot,
      AiProviderConfig,
      AnalyticsEvent,
    ]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
          username: configService.get('REDIS_USERNAME'),
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
    }),
    AuthModule,
    UsersModule,
    RedisModule,
    ConversationsModule,
    StateModule,
    AIModule,
    GatewayModule,
    AdminModule,
    SchedulerModule,
    AnalyticsModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
})
export class AppModule {}
