import { Module } from '@nestjs/common';
import { StateModule } from '../state/state.module';
import { AdminReplayController } from './admin-replay.controller';

@Module({
  imports: [StateModule],
  controllers: [AdminReplayController],
})
export class AdminModule {}
