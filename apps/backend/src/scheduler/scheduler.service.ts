import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StateManagerService } from '../state/state-manager.service';

@Injectable()
export class SchedulerService {
  constructor(private stateManagerService: StateManagerService) {}

  /**
   * Run snapshot cleanup daily at 2 AM
   * Removes snapshots older than retention period (30 days)
   */
  @Cron('0 2 * * *')
  async cleanupOldSnapshots() {
    try {
      const deletedCount = await this.stateManagerService.cleanupOldSnapshots();
      console.log(`✅ Snapshot cleanup completed. Deleted ${deletedCount} old snapshots.`);
    } catch (error) {
      console.error('❌ Error during snapshot cleanup:', error);
    }
  }
}
