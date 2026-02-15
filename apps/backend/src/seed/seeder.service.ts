import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Conversation, Message, MessageRole } from '../entities';
import { SEED_CONVERSATIONS } from './seed-data';

/**
 * Idempotent database seeder.
 *
 * Creates a fixed "demo" user and populates golden conversations
 * whose UI schemas are hand-verified and cover every component
 * pattern in the design-system.
 *
 * These conversations serve two purposes:
 *  1. **Few-shot examples** — the AI agent can reference them when
 *     generating new UIs, reducing hallucinations.
 *  2. **Renderer smoke tests** — if these render correctly, all
 *     component types work.
 *
 * The seeder runs once on first boot. It checks whether the demo
 * user already has conversations and skips if so.
 */
@Injectable()
export class SeederService implements OnModuleInit {
  private readonly logger = new Logger(SeederService.name);

  /** Fixed UUID so the seed is fully idempotent across deploys. */
  static readonly DEMO_USER_ID = '00000000-0000-4000-a000-000000000001';
  static readonly DEMO_EMAIL = 'demo@genui.dev';

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.seed();
    } catch (error) {
      this.logger.warn(
        `Seeder failed (non-fatal): ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  private async seed(): Promise<void> {
    // 1. Ensure demo user exists
    let user = await this.userRepo.findOne({
      where: { id: SeederService.DEMO_USER_ID },
    });

    if (!user) {
      user = this.userRepo.create({
        id: SeederService.DEMO_USER_ID,
        email: SeederService.DEMO_EMAIL,
        name: 'Demo User',
        provider: 'local',
        passwordHash: '', // no login capability
      });
      await this.userRepo.save(user);
      this.logger.log(`Created demo user: ${SeederService.DEMO_EMAIL}`);
    }

    // 2. Check if already seeded
    const existing = await this.conversationRepo.count({
      where: { userId: SeederService.DEMO_USER_ID },
    });

    if (existing >= SEED_CONVERSATIONS.length) {
      this.logger.log(
        `Seed data already present (${existing} conversations). Skipping.`,
      );
      return;
    }

    // 3. Seed conversations
    let created = 0;
    for (const seed of SEED_CONVERSATIONS) {
      // Skip if this specific title already exists for the demo user
      const titleExists = await this.conversationRepo.findOne({
        where: { userId: SeederService.DEMO_USER_ID, title: seed.title },
      });
      if (titleExists) continue;

      const now = new Date();
      const conversation = this.conversationRepo.create({
        userId: SeederService.DEMO_USER_ID,
        title: seed.title,
        lastMessageAt: now,
      });
      const savedConversation = await this.conversationRepo.save(conversation);

      // User prompt message
      const userMessage = this.messageRepo.create({
        conversationId: savedConversation.id,
        role: MessageRole.USER,
        content: seed.prompt,
      });
      await this.messageRepo.save(userMessage);

      // Assistant response with golden UI schema
      const assistantMessage = this.messageRepo.create({
        conversationId: savedConversation.id,
        role: MessageRole.ASSISTANT,
        content: null,
        uiSchema: seed.schema,
      });
      await this.messageRepo.save(assistantMessage);

      created++;
    }

    this.logger.log(
      `Seeded ${created} golden conversations for demo user (${SeederService.DEMO_EMAIL}).`,
    );
  }
}
