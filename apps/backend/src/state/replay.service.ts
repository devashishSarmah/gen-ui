import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { StateManagerService, ReplayState } from './state-manager.service';
import { Conversation, InteractionEvent, StateSnapshot } from '../entities';

export interface ReplayFrame {
  sequenceNumber: number;
  timestamp: Date;
  event: InteractionEvent;
  state: any;
}

export interface ReplaySession {
  conversationId: string;
  currentFrameIndex: number;
  totalFrames: number;
  frames: ReplayFrame[];
  sessionStartedAt: Date;
}

@Injectable()
export class ReplayService {
  private activeSessions: Map<string, ReplaySession> = new Map();

  constructor(
    private stateManagerService: StateManagerService,
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(InteractionEvent)
    private interactionEventRepository: Repository<InteractionEvent>,
    @InjectRepository(StateSnapshot)
    private stateSnapshotRepository: Repository<StateSnapshot>
  ) {}

  /**
   * Start a replay session for a conversation
   * Returns the initial state and all frames
   */
  async startReplaySession(
    conversationId: string,
    userId: string
  ): Promise<ReplaySession> {
    // Verify user owns the conversation (admin check is done at controller level)
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }

    if (conversation.userId !== userId) {
      throw new ForbiddenException('You do not have access to this conversation');
    }

    // Get all events for the conversation
    const events = await this.interactionEventRepository.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });

    // Build frames by replaying from snapshots
    const frames = await this.buildReplayFrames(conversationId, events);

    const session: ReplaySession = {
      conversationId,
      currentFrameIndex: 0,
      totalFrames: frames.length,
      frames,
      sessionStartedAt: new Date(),
    };

    // Store session (in production, store in Redis with expiration)
    this.activeSessions.set(conversationId, session);

    return session;
  }

  /**
   * Build replay frames by replaying events from snapshots
   */
  private async buildReplayFrames(
    conversationId: string,
    events: InteractionEvent[]
  ): Promise<ReplayFrame[]> {
    const frames: ReplayFrame[] = [];

    // Get the nearest snapshot for starting point
    const snapshot = await this.stateSnapshotRepository.findOne({
      where: { conversationId },
      order: { eventSequenceNumber: 'DESC' },
    });

    let currentState = snapshot
      ? snapshot.snapshotData
      : { currentUiSchema: null, uiState: {} };

    // Filter events to only those after the snapshot
    const startingSequence = snapshot?.eventSequenceNumber || 0;
    const relevantEvents = events.filter(event => event.eventSequenceNumber > startingSequence);

    // Build frames for each event after the snapshot
    relevantEvents.forEach((event) => {
      currentState = this.applyEventToState(currentState, event);
      frames.push({
        sequenceNumber: event.eventSequenceNumber,
        timestamp: event.createdAt,
        event,
        state: JSON.parse(JSON.stringify(currentState)), // Deep copy
      });
    });

    return frames;
  }

  /**
   * Apply event to state (same logic as StateManager)
   */
  private applyEventToState(state: any, event: InteractionEvent): any {
    const updatedState = JSON.parse(JSON.stringify(state)); // Deep copy

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
        updatedState.uiState = {
          ...updatedState.uiState,
          lastInteraction: event.eventData,
        };
        break;
    }

    return updatedState;
  }

  /**
   * Get a specific frame from the replay
   */
  async getReplayFrame(conversationId: string, frameIndex: number): Promise<ReplayFrame> {
    const session = this.activeSessions.get(conversationId);

    if (!session) {
      throw new NotFoundException(`Replay session for ${conversationId} not found`);
    }

    if (frameIndex < 0 || frameIndex >= session.frames.length) {
      throw new NotFoundException(`Frame ${frameIndex} not found in replay`);
    }

    return session.frames[frameIndex];
  }

  /**
   * Navigate to next frame in replay
   */
  async nextFrame(conversationId: string): Promise<ReplayFrame> {
    const session = this.activeSessions.get(conversationId);

    if (!session) {
      throw new NotFoundException(`Replay session for ${conversationId} not found`);
    }

    if (session.currentFrameIndex >= session.totalFrames - 1) {
      throw new NotFoundException('Already at the last frame');
    }

    session.currentFrameIndex += 1;
    return session.frames[session.currentFrameIndex];
  }

  /**
   * Navigate to previous frame in replay
   */
  async previousFrame(conversationId: string): Promise<ReplayFrame> {
    const session = this.activeSessions.get(conversationId);

    if (!session) {
      throw new NotFoundException(`Replay session for ${conversationId} not found`);
    }

    if (session.currentFrameIndex <= 0) {
      throw new NotFoundException('Already at the first frame');
    }

    session.currentFrameIndex -= 1;
    return session.frames[session.currentFrameIndex];
  }

  /**
   * Jump to specific frame
   */
  async jumpToFrame(conversationId: string, frameIndex: number): Promise<ReplayFrame> {
    const session = this.activeSessions.get(conversationId);

    if (!session) {
      throw new NotFoundException(`Replay session for ${conversationId} not found`);
    }

    if (frameIndex < 0 || frameIndex >= session.totalFrames) {
      throw new NotFoundException(`Frame ${frameIndex} is out of range (0-${session.totalFrames - 1})`);
    }

    session.currentFrameIndex = frameIndex;
    return session.frames[frameIndex];
  }

  /**
   * Get audit trail for export
   */
  async getAuditTrailForExport(conversationId: string): Promise<any> {
    return this.stateManagerService.exportAuditTrail(conversationId);
  }

  /**
   * End replay session
   */
  async endReplaySession(conversationId: string): Promise<void> {
    this.activeSessions.delete(conversationId);
  }

  /**
   * Get current replay session info
   */
  async getReplaySessionInfo(conversationId: string): Promise<ReplaySession> {
    const session = this.activeSessions.get(conversationId);

    if (!session) {
      throw new NotFoundException(`Replay session for ${conversationId} not found`);
    }

    return {
      ...session,
      frames: [], // Don't return all frames in info endpoint
    };
  }
}
