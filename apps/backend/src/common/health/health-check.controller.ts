import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { HealthCheckService } from './health-check.service';

/**
 * Health check controller for monitoring
 * Provides endpoints for health status and liveness probes
 */
@Controller('health')
export class HealthCheckController {
  constructor(private healthCheckService: HealthCheckService) {}

  /**
   * Liveness probe - indicates if service is running
   */
  @Get('live')
  @HttpCode(HttpStatus.OK)
  async liveness() {
    return { status: 'alive', timestamp: new Date() };
  }

  /**
   * Readiness probe - indicates if service is ready to accept requests
   */
  @Get('ready')
  async readiness() {
    const health = await this.healthCheckService.getSystemHealth();
    return health;
  }

  /**
   * Detailed health status
   */
  @Get()
  async getHealth() {
    return await this.healthCheckService.getSystemHealth();
  }
}
