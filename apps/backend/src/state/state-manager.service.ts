import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RedisService } from '../redis/redis.service';
import { ConversationsService } from '../conversations/conversations.service';
import { StateSnapshot } from '../entities';

export interface ConversationState {
  conversationId: string;
  currentUiSchema: any;
  uiState: any;
  lastInteractionAt: Date;
}

@Injectable()
export class StateManagerService {
  private eventSequenceCounter: Map<string, number> = new Map();

  constructor(
    private redisService: RedisService,
    private conversationsService: ConversationsService,
    @InjectRepository(StateSnapshot)
    private stateSnapshotRepository: Repository<StateSnapshot>
  ) {}

  /**
   * Save conversation state to Redis (hot path) and create snapshot
   */
  async saveConversationState(state: ConversationState): Promise<void> {
    // Save to Redis hot storage
    await this.redisService.saveConversationState(state.conversationId, {
      currentUiSchema: JSON.stringify(state.currentUiSchema),
      uiState: JSON.stringify(state.uiState),
      lastInteractionAt: state.lastInteractionAt.toISOString(),
    });

    // Create state snapshot for versioning and replay
    const sequenceNumber = (this.eventSequenceCounter.get(state.conversationId) || 0) + 1;
    this.eventSequenceCounter.set(state.conversationId, sequenceNumber);

    const snapshot = this.stateSnapshotRepository.create({
      conversationId: state.conversationId,
      snapshotData: {
        currentUiSchema: state.currentUiSchema,
        uiState: state.uiState,
        lastInteractionAt: state.lastInteractionAt.toISOString(),
      },
      eventSequenceNumber: sequenceNumber,
    });

    // Queue async write to PostgreSQL for snapshot persistence
    await this.redisService.queueDatabaseWrite({
      table: 'state_snapshots',
      action: 'insert',
      data: {
        conversationId: state.conversationId,
        snapshotData: JSON.stringify(snapshot.snapshotData),
        eventSequenceNumber: sequenceNumber,
        createdAt: new Date(),
      },
    });
  }

  /**
   * Load conversation state from Redis
   */
  async loadConversationState(conversationId: string): Promise<ConversationState | null> {
    const state = await this.redisService.loadConversationState(conversationId);

    if (!state || !state.currentUiSchema) {
      return null;
    }

    return {
      conversationId,
      currentUiSchema: JSON.parse(state.currentUiSchema),
      uiState: state.uiState ? JSON.parse(state.uiState) : {},
      lastInteractionAt: new Date(state.lastInteractionAt),
    };
  }

  /**
   * Update UI state (form values, navigation, etc.)
   */
  async updateUiState(conversationId: string, uiState: any): Promise<void> {
    const existingState = await this.loadConversationState(conversationId);

    if (existingState) {
      existingState.uiState = { ...existingState.uiState, ...uiState };
      existingState.lastInteractionAt = new Date();
      await this.saveConversationState(existingState);
    }

    // Extend TTL on activity
    await this.redisService.extendTTL(conversationId);
  }

  /**
   * Log interaction event
   */
  async logInteractionEvent(
    conversationId: string,
    messageId: string,
    eventType: string,
    eventData: any
  ): Promise<void> {
    const event = {
      conversationId,
      messageId,
      eventType,
      eventData,
      createdAt: new Date(),
    };

    // Save to Redis stream
    await this.redisService.saveEvent(conversationId, event);

    // Queue async write to PostgreSQL
    await this.redisService.queueDatabaseWrite({
      table: 'interaction_events',
      action: 'insert',
      data: event,
    });
  }

  /**
   * Get conversation history from PostgreSQL (cold path)
   */
  async getConversationHistory(conversationId: string): Promise<any[]> {
    return await this.conversationsService.getConversationMessages(conversationId);
  }

  /**
   * Load state from snapshot by sequence number
   */
  async loadStateFromSnapshot(conversationId: string, sequenceNumber?: number): Promise<ConversationState | null> {
    let snapshot;

    if (sequenceNumber) {
      snapshot = await this.stateSnapshotRepository.findOne({
        where: { conversationId, eventSequenceNumber: sequenceNumber },
      });
    } else {
      // Get latest snapshot
      snapshot = await this.stateSnapshotRepository.findOne({
        where: { conversationId },
        order: { eventSequenceNumber: 'DESC' },
      });
    }

    if (!snapshot) {
      return null;
    }

    return {
      conversationId,
      currentUiSchema: snapshot.snapshotData.currentUiSchema,
      uiState: snapshot.snapshotData.uiState,
      lastInteractionAt: new Date(snapshot.snapshotData.lastInteractionAt),
    };
  }

  /**
   * Get all snapshots for a conversation (for replay)
   */
  async getConversationSnapshots(conversationId: string): Promise<StateSnapshot[]> {
    return await this.stateSnapshotRepository.find({
      where: { conversationId },
      order: { eventSequenceNumber: 'ASC' },
    });
  }
}
