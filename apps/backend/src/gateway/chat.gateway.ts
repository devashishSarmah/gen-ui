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
import { Injectable, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConversationsService } from '../conversations/conversations.service';
import { StateManagerService } from '../state/state-manager.service';
import { AIService } from '../ai/ai.service';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSessions: Map<string, { userId: string; conversationId: string }> = new Map();

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

      console.log(`✅ Client connected: ${client.id} (User: ${payload.sub})`);
      client.emit('connected', { message: 'Connected successfully' });
    } catch (error) {
      console.error('❌ Connection error:', error.message);
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
    console.log(`Client disconnected: ${client.id}`);
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
    const session = this.userSessions.get(client.id);

    if (!session || session.conversationId !== data.conversationId) {
      return { error: 'Not in conversation' };
    }

    // Verify user owns the conversation
    const conversation = await this.conversationsService.findConversationById(data.conversationId);
    if (!conversation || conversation.userId !== session.userId) {
      return { error: 'Unauthorized: You do not own this conversation' };
    }

    try {
      // Save user message
      await this.conversationsService.addMessage(
        data.conversationId,
        'user',
        data.prompt
      );

      // Generate title from first prompt if conversation title is default
      if (conversation.title === 'New Conversation') {
        await this.conversationsService.generateTitle(data.conversationId, data.prompt);
      }

      // Get conversation history
      const messages = await this.conversationsService.getConversationMessages(data.conversationId);
      const currentState = await this.stateManager.loadConversationState(data.conversationId);

      // Generate UI with AI
      const context = {
        conversationHistory: messages,
        currentUiState: currentState?.uiState,
        userPrompt: data.prompt,
      };

      // Stream AI response
      for await (const chunk of this.aiService.generateUI(context, data.provider)) {
        // Emit partial updates
        this.server.to(`conversation:${data.conversationId}`).emit('ui-stream', chunk);

        // Save complete schema
        if (chunk.type === 'complete') {
          await this.stateManager.saveConversationState({
            conversationId: data.conversationId,
            currentUiSchema: chunk.data,
            uiState: {},
            lastInteractionAt: new Date(),
          });

          // Save assistant message to PostgreSQL
          await this.conversationsService.addMessage(
            data.conversationId,
            'assistant',
            null,
            chunk.data
          );
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error handling prompt:', error);
      return { error: error.message };
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
    }
  ) {
    const session = this.userSessions.get(client.id);

    if (!session || session.conversationId !== data.conversationId) {
      return { error: 'Not in conversation' };
    }

    // Verify user owns the conversation
    const conversation = await this.conversationsService.findConversationById(data.conversationId);
    if (!conversation || conversation.userId !== session.userId) {
      return { error: 'Unauthorized: You do not own this conversation' };
    }

    try {
      // Log interaction event
      await this.stateManager.logInteractionEvent(
        data.conversationId,
        data.messageId,
        data.eventType,
        data.eventData
      );

      // Update UI state
      await this.stateManager.updateUiState(data.conversationId, data.eventData);

      // If there's a prompt, generate updated UI
      if (data.prompt) {
        const currentState = await this.stateManager.loadConversationState(data.conversationId);
        const messages = await this.conversationsService.getConversationMessages(data.conversationId);

        const context = {
          conversationHistory: messages,
          currentUiState: currentState?.uiState,
          userPrompt: data.prompt,
          lastInteraction: data.eventData,
        };

        // Stream AI response
        for await (const chunk of this.aiService.updateUI(
          currentState?.currentUiSchema,
          data.eventData,
          context
        )) {
          this.server.to(`conversation:${data.conversationId}`).emit('ui-stream', chunk);

          if (chunk.type === 'complete') {
            await this.stateManager.saveConversationState({
              conversationId: data.conversationId,
              currentUiSchema: chunk.data,
              uiState: currentState?.uiState || {},
              lastInteractionAt: new Date(),
            });

            // Note: Assistant message persisted via StateManagerService.saveConversationState
            // Only call addMessage for user-initiated messages to avoid duplicates
          }
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error handling interaction:', error);
      return { error: error.message };
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
}
