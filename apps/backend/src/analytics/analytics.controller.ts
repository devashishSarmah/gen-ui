import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import { TrackEventDto } from './dto/track-event.dto';
import { Request } from 'express';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('track')
  async trackEvent(
    @Body() dto: TrackEventDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.sub || undefined;
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip || undefined;
    const userAgent = req.headers['user-agent'] || undefined;

    return this.analyticsService.trackEvent(dto, userId, ipAddress, userAgent);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats')
  async getStats(@Query('days') days?: string) {
    const numDays = days ? parseInt(days, 10) : 30;
    return this.analyticsService.getEventStats(numDays);
  }

  @UseGuards(JwtAuthGuard)
  @Get('events')
  async getRecentEvents(@Query('limit') limit?: string) {
    const numLimit = limit ? parseInt(limit, 10) : 100;
    return this.analyticsService.getRecentEvents(numLimit);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user-events')
  async getUserEvents(@Req() req: Request, @Query('limit') limit?: string) {
    const userId = (req as any).user?.sub;
    const numLimit = limit ? parseInt(limit, 10) : 50;
    return this.analyticsService.getEventsByUser(userId, numLimit);
  }
}
