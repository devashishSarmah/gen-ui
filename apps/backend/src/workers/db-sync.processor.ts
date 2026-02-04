import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  User,
  Conversation,
  Message,
  InteractionEvent,
  StateSnapshot,
  AiProviderConfig,
} from '../entities';

@Processor('db-write')
export class DbSyncProcessor {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(InteractionEvent)
    private interactionEventRepository: Repository<InteractionEvent>,
    @InjectRepository(StateSnapshot)
    private stateSnapshotRepository: Repository<StateSnapshot>,
    @InjectRepository(AiProviderConfig)
    private aiProviderConfigRepository: Repository<AiProviderConfig>
  ) {}

  @Process('sync')
  async handleSync(job: Job): Promise<void> {
    const { table, action, data } = job.data;

    try {
      const repository = this.getRepository(table);

      switch (action) {
        case 'insert':
          await repository.save(data);
          console.log(`✅ Inserted into ${table}:`, data.id || 'batch');
          break;

        case 'update':
          await repository.update(data.id, data);
          console.log(`✅ Updated ${table}:`, data.id);
          break;

        case 'delete':
          await repository.delete(data.id);
          console.log(`✅ Deleted from ${table}:`, data.id);
          break;

        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      console.error(`❌ DB sync error for ${table}:`, error);
      throw error; // Re-throw to trigger Bull retry mechanism
    }
  }

  private getRepository(table: string): Repository<any> {
    switch (table) {
      case 'users':
        return this.userRepository;
      case 'conversations':
        return this.conversationRepository;
      case 'messages':
        return this.messageRepository;
      case 'interaction_events':
        return this.interactionEventRepository;
      case 'state_snapshots':
        return this.stateSnapshotRepository;
      case 'ai_provider_configs':
        return this.aiProviderConfigRepository;
      default:
        throw new Error(`Unknown table: ${table}`);
    }
  }
}
