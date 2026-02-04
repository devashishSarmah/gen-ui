import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '../redis/redis.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { StateSnapshot, InteractionEvent, Conversation } from '../entities';
import { StateManagerService } from './state-manager.service';
import { ReplayService } from './replay.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([StateSnapshot, InteractionEvent, Conversation]),
    RedisModule,
    ConversationsModule,
  ],
  providers: [StateManagerService, ReplayService],
  exports: [StateManagerService, ReplayService],
})
export class StateModule {}
