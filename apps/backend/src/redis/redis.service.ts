import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private readonly DEFAULT_TTL = 24 * 60 * 60; // 24 hours in seconds

  constructor(
    private configService: ConfigService,
    @InjectQueue('db-write') private dbWriteQueue: Queue
  ) {}

  async onModuleInit() {
    this.client = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get<number>('REDIS_PORT'),
      password: this.configService.get('REDIS_PASSWORD'),
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('connect', () => {
      console.log('✅ Redis connected');
    });

    this.client.on('error', (err) => {
      console.error('❌ Redis connection error:', err);
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  /**
   * Save conversation state to Redis with TTL
   */
  async saveConversationState(
    conversationId: string,
    state: any
  ): Promise<void> {
    const key = `conversation:${conversationId}:state`;
    await this.client.hset(key, state);
    await this.client.expire(key, this.DEFAULT_TTL);
  }

  /**
   * Load conversation state from Redis
   */
  async loadConversationState(conversationId: string): Promise<any> {
    const key = `conversation:${conversationId}:state`;
    return await this.client.hgetall(key);
  }

  /**
   * Extend TTL on conversation activity
   */
  async extendTTL(conversationId: string): Promise<void> {
    const key = `conversation:${conversationId}:state`;
    await this.client.expire(key, this.DEFAULT_TTL);
  }

  /**
   * Save event to Redis stream
   */
  async saveEvent(conversationId: string, event: any): Promise<string> {
    const streamKey = `conversation:${conversationId}:events`;
    const eventId = await this.client.xadd(
      streamKey,
      '*',
      'data',
      JSON.stringify(event)
    );
    return eventId;
  }

  /**
   * Get events from Redis stream
   */
  async getEvents(
    conversationId: string,
    fromId: string = '0'
  ): Promise<any[]> {
    const streamKey = `conversation:${conversationId}:events`;
    const results = await this.client.xrange(streamKey, fromId, '+');

    return results.map(([id, fields]) => ({
      id,
      data: JSON.parse(fields[1]),
    }));
  }

  /**
   * Queue database write operation
   */
  async queueDatabaseWrite(operation: {
    table: string;
    action: 'insert' | 'update' | 'delete';
    data: any;
  }): Promise<void> {
    await this.dbWriteQueue.add('sync', operation, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

  /**
   * Generic set with TTL
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setex(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  /**
   * Generic get
   */
  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  /**
   * Delete key
   */
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}
