import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AnalyticsEvent } from '../entities';
import { TrackEventDto } from './dto/track-event.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly analyticsRepo: Repository<AnalyticsEvent>,
  ) {}

  async trackEvent(
    dto: TrackEventDto,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AnalyticsEvent> {
    const event = this.analyticsRepo.create({
      userId: userId ?? undefined,
      eventName: dto.eventName,
      category: dto.category,
      properties: dto.properties ?? undefined,
      sessionId: dto.sessionId ?? undefined,
      ipAddress: ipAddress ?? undefined,
      userAgent: userAgent ?? undefined,
      pageUrl: dto.pageUrl ?? undefined,
    });

    const saved = await this.analyticsRepo.save(event) as AnalyticsEvent;
    this.logger.debug(`Tracked event: ${dto.eventName} [${dto.category}] for user ${userId || 'anonymous'}`);
    return saved;
  }

  async getEventsByUser(userId: string, limit = 50): Promise<AnalyticsEvent[]> {
    return this.analyticsRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getRecentEvents(limit = 100): Promise<AnalyticsEvent[]> {
    return this.analyticsRepo.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getEventStats(days = 30): Promise<{
    totalEvents: number;
    uniqueUsers: number;
    eventsByCategory: Record<string, number>;
    eventsByName: { eventName: string; count: number }[];
    dailyActivity: { date: string; count: number }[];
  }> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const totalEvents = await this.analyticsRepo.count({
      where: { createdAt: Between(since, new Date()) },
    });

    const uniqueUsersResult = await this.analyticsRepo
      .createQueryBuilder('event')
      .select('COUNT(DISTINCT event.userId)', 'count')
      .where('event.createdAt >= :since', { since })
      .andWhere('event.userId IS NOT NULL')
      .getRawOne();

    const categoryResults = await this.analyticsRepo
      .createQueryBuilder('event')
      .select('event.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('event.createdAt >= :since', { since })
      .groupBy('event.category')
      .getRawMany();

    const eventNameResults = await this.analyticsRepo
      .createQueryBuilder('event')
      .select('event.eventName', 'eventName')
      .addSelect('COUNT(*)', 'count')
      .where('event.createdAt >= :since', { since })
      .groupBy('event.eventName')
      .orderBy('count', 'DESC')
      .limit(20)
      .getRawMany();

    const dailyResults = await this.analyticsRepo
      .createQueryBuilder('event')
      .select("TO_CHAR(event.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('event.createdAt >= :since', { since })
      .groupBy("TO_CHAR(event.createdAt, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany();

    const eventsByCategory: Record<string, number> = {};
    categoryResults.forEach((r) => {
      eventsByCategory[r.category] = parseInt(r.count, 10);
    });

    return {
      totalEvents,
      uniqueUsers: parseInt(uniqueUsersResult?.count || '0', 10),
      eventsByCategory,
      eventsByName: eventNameResults.map((r) => ({
        eventName: r.eventName,
        count: parseInt(r.count, 10),
      })),
      dailyActivity: dailyResults.map((r) => ({
        date: r.date,
        count: parseInt(r.count, 10),
      })),
    };
  }
}
