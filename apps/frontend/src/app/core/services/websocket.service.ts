import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from '../../auth/auth.service';

export interface UIStreamChunk {
  type: 'partial' | 'complete' | 'error';
  data: any;
  sequenceId?: number;
}

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000; // Start with 1 second

  // Signal-based state
  readonly isConnected = signal(false);
  readonly connectionStatus = signal<'disconnected' | 'connecting' | 'connected'>('disconnected');
  readonly reconnectCount = signal(0);
  readonly lastError = signal<string | null>(null);

  // Subject for event streaming
  private uiStreamSubject = new BehaviorSubject<UIStreamChunk | null>(null);
  public uiStream$ = this.uiStreamSubject.asObservable();

  constructor(private authService: AuthService) {}

  /**
   * Connect to WebSocket server with JWT authentication
   */
  async connect(): Promise<void> {
    if (this.socket?.connected) {
      return;
    }

    this.connectionStatus.set('connecting');

    const token = this.authService.getToken();
    if (!token) {
      this.lastError.set('No authentication token available');
      this.connectionStatus.set('disconnected');
      throw new Error('Authentication required to connect');
    }

    const backendUrl = this.getBackendUrl();

    this.socket = io(backendUrl, {
      auth: {
        token: `Bearer ${token}`,
      },
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    // Connection event handlers
    this.socket.on('connect', () => this.onConnect());
    this.socket.on('disconnect', (reason) => this.onDisconnect(reason));
    this.socket.on('reconnect_attempt', () => this.onReconnectAttempt());
    this.socket.on('error', (error) => this.onError(error));

    // WebSocket stream events
    this.socket.on('ui-stream', (chunk: UIStreamChunk) => {
      this.uiStreamSubject.next(chunk);
    });

    this.socket.on('connected', (data) => {
      console.log('✅ Connected to gateway:', data);
      this.lastError.set(null);
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionStatus.set('disconnected');
    this.isConnected.set(false);
  }

  /**
   * Send prompt to generate new UI
   */
  sendPrompt(conversationId: string, prompt: string, provider?: string): void {
    if (!this.socket?.connected) {
      this.lastError.set('WebSocket not connected');
      throw new Error('WebSocket not connected');
    }

    this.socket.emit('prompt', {
      conversationId,
      prompt,
      provider,
    });
  }

  /**
   * Send interaction event
   */
  sendInteraction(
    conversationId: string,
    messageId: string,
    eventType: string,
    eventData: any,
    prompt?: string
  ): void {
    if (!this.socket?.connected) {
      this.lastError.set('WebSocket not connected');
      throw new Error('WebSocket not connected');
    }

    this.socket.emit('interaction', {
      conversationId,
      messageId,
      eventType,
      eventData,
      prompt,
    });
  }

  /**
   * Join a conversation room
   */
  joinConversation(conversationId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.socket.emit(
        'join-conversation',
        { conversationId },
        (response: any) => {
          if (response?.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  /**
   * Get conversation state
   */
  getConversationState(conversationId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.socket.emit('get-state', { conversationId }, (response: any) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Handle successful connection
   */
  private onConnect(): void {
    console.log('✅ WebSocket connected');
    this.isConnected.set(true);
    this.connectionStatus.set('connected');
    this.reconnectAttempts = 0;
    this.reconnectCount.set(0);
    this.lastError.set(null);
  }

  /**
   * Handle disconnection
   */
  private onDisconnect(reason: string): void {
    console.log('❌ WebSocket disconnected:', reason);
    this.isConnected.set(false);
    this.connectionStatus.set('disconnected');

    if (reason === 'io server disconnect' || reason === 'auth_error') {
      this.lastError.set(`Connection closed: ${reason}`);
      this.reconnectAttempts = this.maxReconnectAttempts; // Stop reconnecting
    }
  }

  /**
   * Handle reconnection attempts
   */
  private onReconnectAttempt(): void {
    this.reconnectAttempts++;
    this.reconnectCount.set(this.reconnectAttempts);
    console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
  }

  /**
   * Handle WebSocket errors
   */
  private onError(error: any): void {
    console.error('❌ WebSocket error:', error);
    this.lastError.set(typeof error === 'string' ? error : error?.message || 'Unknown error');
  }

  /**
   * Get backend URL
   */
  private getBackendUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.hostname;
    const port = window.location.port
      ? `:${window.location.port === '4200' ? '3000' : window.location.port}`
      : '';
    return `${protocol}://${host}${port}`;
  }

  /**
   * Check if connected
   */
  isWebSocketConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get underlying Socket.IO instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}
