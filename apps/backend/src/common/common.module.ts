import { Module } from '@nestjs/common';
import { HealthCheckController } from './health/health-check.controller';
import { HealthCheckService } from './health/health-check.service';
import { FaultTolerantAiService } from './ai/fault-tolerant-ai.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [HealthCheckController],
  providers: [HealthCheckService, FaultTolerantAiService],
  exports: [HealthCheckService, FaultTolerantAiService],
})
export class CommonModule {}
