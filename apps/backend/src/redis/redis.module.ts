import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  User,
  Conversation,
  Message,
  InteractionEvent,
  StateSnapshot,
  AiProviderConfig,
} from '../entities';
import { RedisService } from './redis.service';
import { DbSyncProcessor } from '../workers/db-sync.processor';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      User,
      Conversation,
      Message,
      InteractionEvent,
      StateSnapshot,
      AiProviderConfig,
    ]),
    BullModule.registerQueue({
      name: 'db-write',
    }),
  ],
  providers: [RedisService, DbSyncProcessor],
  exports: [RedisService],
})
export class RedisModule {}
