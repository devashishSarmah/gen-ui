import { Injectable } from '@nestjs/common';
import { Repository, LessThan } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RedisService } from '../redis/redis.service';
import { ConversationsService } from '../conversations/conversations.service';
import { StateSnapshot, InteractionEvent } from '../entities';

export interface ConversationState {
  conversationId: string;
  currentUiSchema: any;
  uiState: any;
  lastInteractionAt: Date;
}

export interface ReplayState {
  snapshotId?: string;
  eventSequenceNumber: number;
  state: ConversationState;
  events: InteractionEvent[];
}

@Injectable()
export class StateManagerService {
  private snapshotTriggerCounter: Map<string, number> = new Map();
  private lastSnapshotTime: Map<string, Date> = new Map();
  
  private readonly SNAPSHOT_INTERACTION_THRESHOLD = 10;
  private readonly SNAPSHOT_TIME_THRESHOLD = 5 * 60 * 1000; // 5 minutes in ms
  private readonly SNAPSHOT_RETENTION_DAYS = 30;
  private readonly KEEP_EVENTS_AFTER_SNAPSHOT = 100; // Keep recent events for faster replay

  constructor(
    private redisService: RedisService,
    private conversationsService: ConversationsService,
    @InjectRepository(StateSnapshot)
    private stateSnapshotRepository: Repository<StateSnapshot>,
    @InjectRepository(InteractionEvent)
    private interactionEventRepository: Repository<InteractionEvent>
  ) {}

  /**
   * Save conversation state to Redis (hot path) and create snapshot if needed
   */
  async saveConversationState(state: ConversationState): Promise<void> {
    // Save to Redis hot storage
    await this.redisService.saveConversationState(state.conversationId, {
      currentUiSchema: JSON.stringify(state.currentUiSchema),
      uiState: JSON.stringify(state.uiState),
      lastInteractionAt: state.lastInteractionAt.toISOString(),
    });

    // Check if snapshot should be created
    await this.checkAndCreateSnapshot(state);

    // Extend TTL on activity
    await this.redisService.extendTTL(state.conversationId);
  }

  /**
   * Check if snapshot should be created based on interaction count or time threshold
   */
  private async checkAndCreateSnapshot(state: ConversationState): Promise<void> {
    const interactionCount = (this.snapshotTriggerCounter.get(state.conversationId) || 0) + 1;
    this.snapshotTriggerCounter.set(state.conversationId, interactionCount);

    const lastSnapshot = this.lastSnapshotTime.get(state.conversationId);
    const timeSinceSnapshot = lastSnapshot ? Date.now() - lastSnapshot.getTime() : Infinity;

    const shouldCreateSnapshot =
      interactionCount >= this.SNAPSHOT_INTERACTION_THRESHOLD ||
      timeSinceSnapshot >= this.SNAPSHOT_TIME_THRESHOLD;

    if (shouldCreateSnapshot) {
      await this.createSnapshot(state);
      this.snapshotTriggerCounter.set(state.conversationId, 0);
      this.lastSnapshotTime.set(state.conversationId, new Date());

      // Trim old events from Redis stream after snapshot
      await this.trimEventStream(state.conversationId);
    }
  }

  /**
   * Create a snapshot of current conversation state
   */
  private async createSnapshot(state: ConversationState): Promise<StateSnapshot> {
    // Get the latest event sequence number from storage
    const latestEvent = await this.interactionEventRepository.findOne({
      where: { conversationId: state.conversationId },
      order: { eventSequenceNumber: 'DESC' },
    });
    const sequenceNumber = latestEvent?.eventSequenceNumber || 0;

    const snapshot = this.stateSnapshotRepository.create({
      conversationId: state.conversationId,
      snapshotData: {
        currentUiSchema: state.currentUiSchema,
        uiState: state.uiState,
        lastInteractionAt: state.lastInteractionAt.toISOString(),
      },
      eventSequenceNumber: sequenceNumber,
    });

    // Persist to PostgreSQL
    const savedSnapshot = await this.stateSnapshotRepository.save(snapshot);

    // Also cache in Redis for quick access
    await this.redisService.set(
      `conversation:${state.conversationId}:latest-snapshot`,
      JSON.stringify({
        id: savedSnapshot.id,
        sequenceNumber: savedSnapshot.eventSequenceNumber,
      }),
      24 * 60 * 60 // 24 hours
    );

    return savedSnapshot;
  }

  /**
   * Trim event stream to keep only recent events after snapshot
   */
  private async trimEventStream(conversationId: string): Promise<void> {
    // Get the sequence number of events to keep from
    const latestSnapshot = await this.stateSnapshotRepository.findOne({
      where: { conversationId },
      order: { eventSequenceNumber: 'DESC' },
    });

    if (latestSnapshot) {
      // Keep events starting from: (latestSnapshot.eventSequenceNumber - KEEP_EVENTS_AFTER_SNAPSHOT + 1)
      // This preserves KEEP_EVENTS_AFTER_SNAPSHOT events before the snapshot point
      const keepAfterSequence = Math.max(1, latestSnapshot.eventSequenceNumber - this.KEEP_EVENTS_AFTER_SNAPSHOT + 1);
      
      // Trim Redis stream (keep stream entries after cutoff sequence)
      await this.redisService.trimEventStream(conversationId, keepAfterSequence, this.KEEP_EVENTS_AFTER_SNAPSHOT);
    }
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
    // Get next sequence number by finding the latest event
    const latestEvent = await this.interactionEventRepository.findOne({
      where: { conversationId },
      order: { eventSequenceNumber: 'DESC' },
    });
    const nextSequenceNumber = (latestEvent?.eventSequenceNumber || 0) + 1;

    const event = {
      conversationId,
      messageId,
      eventType,
      eventData,
      eventSequenceNumber: nextSequenceNumber,
      createdAt: new Date(),
    };

    // Save to Redis stream and capture stream ID
    const streamId = await this.redisService.saveEvent(conversationId, event);

    // Queue async write to PostgreSQL with stream ID
    await this.redisService.queueDatabaseWrite({
      table: 'interaction_events',
      action: 'insert',
      data: {
        ...event,
        streamId,
      },
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
   * Replay conversation from a specific point in time
   * Loads nearest snapshot and replays events forward
   */
  async replayConversationToPoint(
    conversationId: string,
    targetSequenceNumber?: number
  ): Promise<ReplayState> {
    // Find the nearest snapshot at or before target
    let snapshot: StateSnapshot | null = null;
    if (targetSequenceNumber) {
      snapshot = await this.stateSnapshotRepository.findOne({
        where: {
          conversationId,
          eventSequenceNumber: LessThan(targetSequenceNumber + 1),
        },
        order: { eventSequenceNumber: 'DESC' },
      });
    } else {
      snapshot = await this.stateSnapshotRepository.findOne({
        where: { conversationId },
        order: { eventSequenceNumber: 'DESC' },
      });
    }

    let state: ConversationState;
    let startSequence = 0;

    if (snapshot) {
      state = {
        conversationId,
        currentUiSchema: snapshot.snapshotData.currentUiSchema,
        uiState: snapshot.snapshotData.uiState,
        lastInteractionAt: new Date(snapshot.snapshotData.lastInteractionAt),
      };
      startSequence = snapshot.eventSequenceNumber;
    } else {
      // No snapshot found, start from empty state
      state = {
        conversationId,
        currentUiSchema: null,
        uiState: {},
        lastInteractionAt: new Date(),
      };
      startSequence = 0;
    }

    // Get events to replay
    const eventsQuery = this.interactionEventRepository
      .createQueryBuilder('event')
      .where('event.conversationId = :conversationId', { conversationId })
      .orderBy('event.createdAt', 'ASC');

    // Add sequence number filter if target specified
    if (targetSequenceNumber) {
      // In a real implementation, you'd track event sequence numbers
      // For now, we'll fetch all and filter by count
      const allEvents = await eventsQuery.getMany();
      const eventsToReplay = allEvents.slice(startSequence, targetSequenceNumber);
      
      // Replay events to reconstruct state
      for (const event of eventsToReplay) {
        state = this.applyEvent(state, event);
      }

      return {
        snapshotId: snapshot?.id,
        eventSequenceNumber: targetSequenceNumber,
        state,
        events: eventsToReplay,
      };
    } else {
      // Get all events from snapshot onwards
      const events = await eventsQuery.getMany();
      const eventsToReplay = events.slice(startSequence);

      for (const event of eventsToReplay) {
        state = this.applyEvent(state, event);
      }

      return {
        snapshotId: snapshot?.id,
        eventSequenceNumber: events.length,
        state,
        events: eventsToReplay,
      };
    }
  }

  /**
   * Apply an event to state (deterministic state reconstruction)
   */
  private applyEvent(state: ConversationState, event: InteractionEvent): ConversationState {
    const updatedState = { ...state };
    updatedState.lastInteractionAt = event.createdAt;

    // Apply event data to state based on event type
    switch (event.eventType) {
      case 'ui-state-changed':
        updatedState.uiState = {
          ...updatedState.uiState,
          ...event.eventData,
        };
        break;
      case 'ui-schema-rendered':
        updatedState.currentUiSchema = event.eventData.schema;
        break;
      case 'interaction':
        // Handle user interaction
        updatedState.uiState = {
          ...updatedState.uiState,
          lastInteraction: event.eventData,
        };
        break;
      // Add more event types as needed
    }

    return updatedState;
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

  /**
   * Get all events for a conversation (audit trail)
   */
  async getConversationAuditTrail(conversationId: string): Promise<InteractionEvent[]> {
    return await this.interactionEventRepository.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Export audit trail as JSON
   */
  async exportAuditTrail(conversationId: string): Promise<any> {
    const events = await this.getConversationAuditTrail(conversationId);
    const snapshots = await this.getConversationSnapshots(conversationId);

    return {
      conversationId,
      exportedAt: new Date().toISOString(),
      totalEvents: events.length,
      totalSnapshots: snapshots.length,
      events: events.map((e) => ({
        id: e.id,
        messageId: e.messageId,
        eventType: e.eventType,
        eventData: e.eventData,
        createdAt: e.createdAt.toISOString(),
      })),
      snapshots: snapshots.map((s) => ({
        id: s.id,
        eventSequenceNumber: s.eventSequenceNumber,
        snapshotData: s.snapshotData,
        createdAt: s.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Clean up old snapshots based on retention policy
   */
  async cleanupOldSnapshots(): Promise<number> {
    const retentionDate = new Date(Date.now() - this.SNAPSHOT_RETENTION_DAYS * 24 * 60 * 60 * 1000);

    const result = await this.stateSnapshotRepository.delete({
      createdAt: LessThan(retentionDate),
    });

    return result.affected || 0;
  }
}
