import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { StateModule } from '../state/state.module';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [ScheduleModule.forRoot(), StateModule],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
