import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

/**
 * Health check statuses
 */
export enum HealthStatus {
  UP = 'UP',
  DOWN = 'DOWN',
  DEGRADED = 'DEGRADED',
}

/**
 * Service health status
 */
export interface ServiceHealth {
  name: string;
  status: HealthStatus;
  responseTime: number;
  error?: string;
}

/**
 * Overall system health
 */
export interface SystemHealth {
  status: HealthStatus;
  timestamp: Date;
  services: ServiceHealth[];
  uptime: number;
}

@Injectable()
export class HealthCheckService {
  private readonly logger = new Logger(HealthCheckService.name);
  private startTime = Date.now();

  constructor(private redisService: RedisService) {}

  /**
   * Get overall system health
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const services: ServiceHealth[] = [];

    // Check Redis
    services.push(await this.checkRedisHealth());

    // Check Database (via conversation service if available)
    // This would be extended to check actual database connection

    const overallStatus = this.determineOverallStatus(services);
    const uptime = Date.now() - this.startTime;

    return {
      status: overallStatus,
      timestamp: new Date(),
      services,
      uptime,
    };
  }

  /**
   * Check Redis health
   */
  private async checkRedisHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      await this.redisService.ping();
      const responseTime = Date.now() - startTime;

      return {
        name: 'Redis',
        status: HealthStatus.UP,
        responseTime,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      this.logger.warn(`Redis health check failed: ${error.message}`);

      return {
        name: 'Redis',
        status: HealthStatus.DOWN,
        responseTime,
        error: error.message,
      };
    }
  }

  /**
   * Determine overall system status
   */
  private determineOverallStatus(services: ServiceHealth[]): HealthStatus {
    const downServices = services.filter(s => s.status === HealthStatus.DOWN);
    const degradedServices = services.filter(s => s.status === HealthStatus.DEGRADED);

    if (downServices.length > 0) {
      return HealthStatus.DOWN;
    }

    if (degradedServices.length > 0) {
      return HealthStatus.DEGRADED;
    }

    return HealthStatus.UP;
  }
}
