import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConversationsService } from '../conversations/conversations.service';
import { StateManagerService } from '../state/state-manager.service';
import { AIService } from '../ai/ai.service';
import { MessageRole } from '../entities';
import { randomUUID } from 'crypto';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server!: Server;

  private userSessions: Map<string, { userId: string; conversationId: string | null }> = new Map();

  constructor(
    private jwtService: JwtService,
    private conversationsService: ConversationsService,
    private stateManager: StateManagerService,
    private aiService: AIService
  ) {}

  /**
   * Handle client connection with JWT authentication
   */
  async handleConnection(client: Socket) {
    try {
      const token = this.extractTokenFromHandshake(client);

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      
      // Store session info
      this.userSessions.set(client.id, {
        userId: payload.sub,
        conversationId: null,
      });

      this.logger.log(`client_connected socket=${client.id} user=${payload.sub}`);
      client.emit('connected', { message: 'Connected successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`client_connection_error socket=${client.id} error=${message}`);
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    const session = this.userSessions.get(client.id);
    
    if (session?.conversationId) {
      client.leave(`conversation:${session.conversationId}`);
    }

    this.userSessions.delete(client.id);
    this.logger.log(`client_disconnected socket=${client.id}`);
  }

  /**
   * Join a conversation room
   */
  @SubscribeMessage('join-conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string }
  ) {
    const session = this.userSessions.get(client.id);

    if (!session) {
      return { error: 'Not authenticated' };
    }

    // Verify user owns the conversation
    const conversation = await this.conversationsService.findConversationById(data.conversationId);
    if (!conversation || conversation.userId !== session.userId) {
      return { error: 'Unauthorized: You do not own this conversation' };
    }

    // Leave previous conversation if any
    if (session.conversationId) {
      client.leave(`conversation:${session.conversationId}`);
    }

    // Join new conversation room
    session.conversationId = data.conversationId;
    client.join(`conversation:${data.conversationId}`);

    // Load conversation state
    const state = await this.stateManager.loadConversationState(data.conversationId);
    const messages = await this.conversationsService.getConversationMessages(data.conversationId);

    return {
      conversationId: data.conversationId,
      state,
      messages,
    };
  }

  /**
   * Handle user prompt (generate new UI)
   */
  @SubscribeMessage('prompt')
  async handlePrompt(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; prompt: string; provider?: string }
  ) {
    const traceId = this.createTraceId();
    const startedAt = Date.now();
    this.logger.log(
      `[${traceId}] prompt_received conversation=${data.conversationId} provider=${data.provider || 'default'} promptLen=${(data.prompt || '').length}`,
    );

    const session = this.userSessions.get(client.id);

    if (!session || session.conversationId !== data.conversationId) {
      this.logger.warn(`[${traceId}] prompt_rejected reason=not_in_conversation`);
      return { error: 'Not in conversation' };
    }

    // Verify user owns the conversation
    const conversation = await this.conversationsService.findConversationById(data.conversationId);
    if (!conversation || conversation.userId !== session.userId) {
      this.logger.warn(`[${traceId}] prompt_rejected reason=unauthorized`);
      return { error: 'Unauthorized: You do not own this conversation' };
    }

    try {
      this.logger.log(`[${traceId}] prompt_stage save_user_message_start`);
      // Save user message
      await this.conversationsService.addMessage(
        data.conversationId,
        MessageRole.USER,
        data.prompt
      );
      this.logger.log(`[${traceId}] prompt_stage save_user_message_done`);

      // Generate title from first prompt if conversation title is default
      if (conversation.title === 'New Conversation') {
        this.logger.log(`[${traceId}] prompt_stage generate_title_start`);
        await this.conversationsService.generateTitle(data.conversationId, data.prompt);
        this.logger.log(`[${traceId}] prompt_stage generate_title_done`);
      }

      // Get conversation history
      this.logger.log(`[${traceId}] prompt_stage load_context_start`);
      const messages = await this.conversationsService.getConversationMessages(data.conversationId);
      const currentState = await this.stateManager.loadConversationState(data.conversationId);
      this.logger.log(
        `[${traceId}] prompt_stage load_context_done messages=${messages.length} hasState=${!!currentState}`,
      );

      // Generate UI with AI
      const context = {
        conversationHistory: messages,
        currentUiState: currentState?.uiState,
        userPrompt: data.prompt,
        traceId,
      };

      // Stream AI response
      let partialChunks = 0;
      let completeChunks = 0;
      let errorChunks = 0;
      let totalPartialChars = 0;

      for await (const chunk of this.aiService.generateUI(context, data.provider)) {
        if (chunk.type === 'partial') {
          partialChunks += 1;
          const content = String(chunk.data?.content || '');
          totalPartialChars += content.length;
          if (partialChunks === 1 || partialChunks % 25 === 0) {
            this.logger.log(
              `[${traceId}] stream_partial count=${partialChunks} partialChars=${content.length} totalPartialChars=${totalPartialChars}`,
            );
          }
        } else if (chunk.type === 'complete') {
          completeChunks += 1;
          this.logger.log(
            `[${traceId}] stream_complete telemetry=${this.summarizeTelemetry((chunk as any).meta?.telemetry)}`,
          );
        } else if (chunk.type === 'error') {
          errorChunks += 1;
          this.logger.error(
            `[${traceId}] stream_error chunkError=${String(chunk.data?.error || 'unknown')}`,
          );
        }

        // Emit partial updates
        this.server.to(`conversation:${data.conversationId}`).emit('ui-stream', chunk);

        // Save complete schema
        if (chunk.type === 'complete') {
          this.logger.log(`[${traceId}] prompt_stage persist_state_start`);
          await this.stateManager.saveConversationState({
            conversationId: data.conversationId,
            currentUiSchema: chunk.data,
            uiState: {},
            lastInteractionAt: new Date(),
          });
          this.logger.log(`[${traceId}] prompt_stage persist_state_done`);

          // Save assistant message to PostgreSQL
          this.logger.log(`[${traceId}] prompt_stage save_assistant_message_start`);
          await this.conversationsService.addMessage(
            data.conversationId,
            MessageRole.ASSISTANT,
            null,
            chunk.data,
            (chunk as any).meta?.telemetry || null,
          );
          this.logger.log(`[${traceId}] prompt_stage save_assistant_message_done`);
        }
      }

      this.logger.log(
        `[${traceId}] prompt_finished durationMs=${Date.now() - startedAt} partialChunks=${partialChunks} completeChunks=${completeChunks} errorChunks=${errorChunks}`,
      );

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[${traceId}] prompt_failed error=${message}`);
      return { error: message };
    }
  }

  /**
   * Handle user interaction with UI
   */
  @SubscribeMessage('interaction')
  async handleInteraction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      conversationId: string;
      messageId: string;
      eventType: string;
      eventData: any;
      prompt?: string;
      provider?: string;
    }
  ) {
    const traceId = this.createTraceId();
    const startedAt = Date.now();
    this.logger.log(
      `[${traceId}] interaction_received conversation=${data.conversationId} messageId=${data.messageId} eventType=${data.eventType} promptLen=${(data.prompt || '').length}`,
    );

    const session = this.userSessions.get(client.id);

    if (!session || session.conversationId !== data.conversationId) {
      this.logger.warn(`[${traceId}] interaction_rejected reason=not_in_conversation`);
      return { error: 'Not in conversation' };
    }

    // Verify user owns the conversation
    const conversation = await this.conversationsService.findConversationById(data.conversationId);
    if (!conversation || conversation.userId !== session.userId) {
      this.logger.warn(`[${traceId}] interaction_rejected reason=unauthorized`);
      return { error: 'Unauthorized: You do not own this conversation' };
    }

    try {
      this.logger.log(`[${traceId}] interaction_stage log_event_start`);
      // Log interaction event
      await this.stateManager.logInteractionEvent(
        data.conversationId,
        data.messageId,
        data.eventType,
        data.eventData
      );
      this.logger.log(`[${traceId}] interaction_stage log_event_done`);

      // Update UI state
      this.logger.log(`[${traceId}] interaction_stage update_ui_state_start`);
      await this.stateManager.updateUiState(data.conversationId, data.eventData);
      this.logger.log(`[${traceId}] interaction_stage update_ui_state_done`);

      // If there's a prompt, generate updated UI
      if (data.prompt) {
        this.logger.log(`[${traceId}] interaction_stage load_context_start`);
        const currentState = await this.stateManager.loadConversationState(data.conversationId);
        const messages = await this.conversationsService.getConversationMessages(data.conversationId);
        this.logger.log(
          `[${traceId}] interaction_stage load_context_done messages=${messages.length} hasState=${!!currentState}`,
        );

        const context = {
          conversationHistory: messages,
          currentUiState: currentState?.uiState,
          userPrompt: data.prompt,
          lastInteraction: data.eventData,
          traceId,
        };

        // Stream AI response
        let partialChunks = 0;
        let completeChunks = 0;
        let errorChunks = 0;
        let totalPartialChars = 0;

        for await (const chunk of this.aiService.updateUI(
          currentState?.currentUiSchema,
          data.eventData,
          context,
          data.provider,
        )) {
          if (chunk.type === 'partial') {
            partialChunks += 1;
            const content = String(chunk.data?.content || '');
            totalPartialChars += content.length;
            if (partialChunks === 1 || partialChunks % 25 === 0) {
              this.logger.log(
                `[${traceId}] interaction_stream_partial count=${partialChunks} partialChars=${content.length} totalPartialChars=${totalPartialChars}`,
              );
            }
          } else if (chunk.type === 'complete') {
            completeChunks += 1;
            this.logger.log(
              `[${traceId}] interaction_stream_complete telemetry=${this.summarizeTelemetry((chunk as any).meta?.telemetry)}`,
            );
          } else if (chunk.type === 'error') {
            errorChunks += 1;
            this.logger.error(
              `[${traceId}] interaction_stream_error chunkError=${String(chunk.data?.error || 'unknown')}`,
            );
          }

          this.server.to(`conversation:${data.conversationId}`).emit('ui-stream', chunk);

          if (chunk.type === 'complete') {
            this.logger.log(`[${traceId}] interaction_stage persist_state_start`);
            await this.stateManager.saveConversationState({
              conversationId: data.conversationId,
              currentUiSchema: chunk.data,
              uiState: currentState?.uiState || {},
              lastInteractionAt: new Date(),
            });
            this.logger.log(`[${traceId}] interaction_stage persist_state_done`);

            this.logger.log(`[${traceId}] interaction_stage save_assistant_message_start`);
            await this.conversationsService.addMessage(
              data.conversationId,
              MessageRole.ASSISTANT,
              null,
              chunk.data,
              (chunk as any).meta?.telemetry || null,
            );
            this.logger.log(`[${traceId}] interaction_stage save_assistant_message_done`);
          }
        }

        this.logger.log(
          `[${traceId}] interaction_prompt_finished durationMs=${Date.now() - startedAt} partialChunks=${partialChunks} completeChunks=${completeChunks} errorChunks=${errorChunks}`,
        );
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[${traceId}] interaction_failed error=${message}`);
      return { error: message };
    }
  }

  /**
   * Get conversation state
   */
  @SubscribeMessage('get-state')
  async handleGetState(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string }
  ) {
    const session = this.userSessions.get(client.id);

    if (!session) {
      return { error: 'Not authenticated' };
    }

    // Verify user owns the conversation
    const conversation = await this.conversationsService.findConversationById(data.conversationId);
    if (!conversation || conversation.userId !== session.userId) {
      return { error: 'Unauthorized: You do not own this conversation' };
    }

    const state = await this.stateManager.loadConversationState(data.conversationId);
    return { state };
  }

  private extractTokenFromHandshake(client: Socket): string | null {
    const authHeader = client.handshake.headers.authorization || client.handshake.auth?.token;
    
    if (!authHeader) {
      return null;
    }

    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return authHeader as string;
  }

  private createTraceId(): string {
    return randomUUID().slice(0, 8);
  }

  private summarizeTelemetry(telemetry: any): string {
    if (!telemetry) {
      return 'none';
    }

    return `tokens=${Number(telemetry.totalTokens || 0)} requests=${Number(telemetry.totalRequests || 0)} costUsd=${Number(telemetry.estimatedCostUsd || 0)}`;
  }
}
