import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '../redis/redis.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { StateSnapshot } from '../entities';
import { StateManagerService } from './state-manager.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([StateSnapshot]),
    RedisModule,
    ConversationsModule,
  ],
  providers: [StateManagerService],
  exports: [StateManagerService],
})
export class StateModule {}
