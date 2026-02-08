import { Component, OnInit, OnDestroy, inject, ViewChild, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ConversationStore, Message } from '../core/stores/conversation.store';
import { UIStateStore } from '../core/stores/ui.store';
import { WebSocketService } from '../core/services/websocket.service';
import { ConversationApiService } from '../core/services/conversation-api.service';
import { SkeletonLoaderComponent } from '../shared/components/skeleton-loader.component';
import { DynamicUIService } from '../core/services/dynamic-ui.service';

@Component({
  selector: 'app-conversation-view',
  standalone: true,
  imports: [CommonModule, FormsModule, SkeletonLoaderComponent],
  template: `
    <div class="conversation-container">
      <div class="messages-area">
        <div class="messages">
          <ng-container *ngIf="!conversationStore.isLoadingMessages()">
            <ng-container *ngIf="conversationStore.messages().length > 0">
              <div
                *ngFor="let message of conversationStore.messages()"
                class="message"
                [class.user]="message.role === 'user'"
                [class.assistant]="message.role === 'assistant'"
              >
                <div class="message-content">
                  {{ message.content || '[UI Schema]' }}
                </div>
                <div class="message-time">
                  {{ message.createdAt | date: 'short' }}
                </div>
              </div>
            </ng-container>

            <ng-container *ngIf="conversationStore.messages().length === 0">
              <div class="empty-conversation">
                <p>No messages yet. Send a message to get started!</p>
              </div>
            </ng-container>
          </ng-container>

          <ng-container *ngIf="conversationStore.isLoadingMessages()">
            <app-skeleton-loader type="paragraph"></app-skeleton-loader>
            <app-skeleton-loader type="paragraph"></app-skeleton-loader>
          </ng-container>

          <!-- Streaming UI Schema Skeleton -->
          <ng-container *ngIf="uiStateStore.isStreaming()">
            <div class="message assistant streaming">
              <div class="message-content">
                <div class="streaming-header">
                  🤖 Generating UI...
                  <span class="progress">
                    {{ uiStateStore.completionPercentage() }}%
                  </span>
                </div>
                <app-skeleton-loader type="card"></app-skeleton-loader>
                <app-skeleton-loader type="form"></app-skeleton-loader>
              </div>
            </div>
          </ng-container>

          <!-- Completed UI Schema -->
          <ng-container *ngIf="uiStateStore.currentSchema() && !uiStateStore.isStreaming()">
            <div class="message assistant">
              <div class="ui-schema-container">
                <div class="schema-preview">
                  <strong>UI Schema Generated</strong>
                  <pre>{{ uiStateStore.currentSchema() | json }}</pre>
                </div>
                <div class="schema-rendered">
                  <strong>Rendered UI</strong>
                  <ng-container #uiHost></ng-container>
                </div>
              </div>
            </div>
          </ng-container>

          <!-- Streaming Error -->
          <ng-container *ngIf="uiStateStore.error()">
            <div class="message error">
              <div class="message-content">
                ❌ {{ uiStateStore.error() }}
              </div>
            </div>
          </ng-container>
        </div>

        <!-- Auto-scroll to bottom -->
        <div #messagesEnd></div>
      </div>

      <div class="input-area">
        <div class="connection-status">
          <span
            class="status-indicator"
            [class.connected]="webSocketService.isConnected()"
            [class.disconnected]="!webSocketService.isConnected()"
          ></span>
          {{ webSocketService.connectionStatus() }}
          <ng-container *ngIf="webSocketService.lastError()">
            - {{ webSocketService.lastError() }}
          </ng-container>
        </div>

        <form (ngSubmit)="sendMessage()" class="message-form">
          <input
            [(ngModel)]="messageText"
            name="message"
            type="text"
            placeholder="Type your message..."
            [disabled]="uiStateStore.isStreaming() || !webSocketService.isConnected()"
            class="message-input"
          />
          <button
            type="submit"
            [disabled]="
              !messageText.trim() ||
              uiStateStore.isStreaming() ||
              !webSocketService.isConnected()
            "
            class="send-btn"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .conversation-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: white;
      }

      .messages-area {
        flex: 1;
        overflow-y: auto;
        padding: 2rem;
        display: flex;
        flex-direction: column;
      }

      .messages {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .message {
        display: flex;
        flex-direction: column;
        max-width: 70%;
        animation: fadeIn 0.3s ease;

        &.user {
          align-self: flex-end;
          background: #1976d2;
          color: white;
          padding: 1rem;
          border-radius: 12px 12px 0 12px;
        }

        &.assistant {
          align-self: flex-start;
          background: #f5f5f5;
          padding: 1rem;
          border-radius: 12px 12px 12px 0;

          &.streaming {
            background: #e3f2fd;
          }
        }

        &.error {
          align-self: flex-start;
          background: #ffebee;
          color: #c62828;
          padding: 1rem;
          border-radius: 12px;
        }
      }

      .message-content {
        word-wrap: break-word;
      }

      .streaming-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        font-weight: 500;

        .progress {
          font-size: 0.875rem;
          color: #666;
        }
      }

      .ui-schema-container {
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 1rem;
      }

      .schema-preview {
        max-height: 300px;
        overflow-y: auto;

        strong {
          display: block;
          margin-bottom: 0.5rem;
        }

        pre {
          background: #fafafa;
          padding: 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          overflow-x: auto;
          margin: 0;
        }
      }

      .message-time {
        font-size: 0.75rem;
        opacity: 0.7;
        margin-top: 0.5rem;
      }

      .empty-conversation {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 1;
        color: #999;
        text-align: center;
      }

      .input-area {
        border-top: 1px solid #e0e0e0;
        padding: 1.5rem;
        background: white;
      }

      .connection-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        margin-bottom: 1rem;
        padding: 0.5rem;
        background: #f5f5f5;
        border-radius: 4px;

        .status-indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;

          &.connected {
            background: #4caf50;
            animation: pulse 2s infinite;
          }

          &.disconnected {
            background: #f44336;
          }
        }
      }

      .message-form {
        display: flex;
        gap: 0.5rem;
      }

      .message-input {
        flex: 1;
        padding: 0.75rem;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        font-size: 1rem;

        &:focus {
          outline: none;
          border-color: #1976d2;
          box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
        }

        &:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }
      }

      .send-btn {
        padding: 0.75rem 1.5rem;
        background: #1976d2;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;

        &:hover:not(:disabled) {
          background: #1565c0;
        }

        &:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }
    `,
  ],
})
export class ConversationViewComponent implements OnInit, OnDestroy {
  conversationStore = inject(ConversationStore);
  uiStateStore = inject(UIStateStore);
  webSocketService = inject(WebSocketService);
  private conversationApi = inject(ConversationApiService);
  private dynamicUIService = inject(DynamicUIService);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  messageText = '';
  private conversationId: string = '';
  private uiHost?: ViewContainerRef;

  @ViewChild('uiHost', { read: ViewContainerRef })
  set uiHostRef(host: ViewContainerRef | undefined) {
    this.uiHost = host;
    this.tryRenderSchema();
  }

  ngOnInit(): void {
    // Get conversation ID from route
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.conversationId = params['id'];
      this.loadConversation();
      this.setupWebSocket();
      
      // Check for pending prompt from welcome screen
      const pendingPrompt = sessionStorage.getItem('pendingPrompt');
      if (pendingPrompt) {
        sessionStorage.removeItem('pendingPrompt');
        // Delay to ensure WebSocket is connected
        setTimeout(() => {
          this.messageText = pendingPrompt;
          this.sendMessage();
        }, 1000);
      }
    });

    // Subscribe to WebSocket stream
    this.webSocketService.uiStream$
      .pipe(takeUntil(this.destroy$))
      .subscribe((chunk) => {
        if (chunk?.type === 'partial') {
          this.uiStateStore.addStreamingChunk(chunk);
        } else if (chunk?.type === 'complete') {
          this.uiStateStore.completeStreaming(chunk.data);
          this.dynamicUIService.loadSchema(chunk.data);
          this.tryRenderSchema();
          this.loadMessages(); // Reload messages to show assistant response
        } else if (chunk?.type === 'error') {
          this.uiStateStore.setStreamingError(chunk.data?.message || 'Error');
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadConversation(): void {
    this.conversationStore.setIsLoadingMessages(true);

    this.conversationApi
      .getConversation(this.conversationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (conversation) => {
          this.conversationStore.setCurrentConversation(this.conversationId);
          this.loadMessages();
        },
        error: (error) => {
          console.error('Failed to load conversation:', error);
          this.conversationStore.setError('Failed to load conversation');
          this.conversationStore.setIsLoadingMessages(false);
        },
      });
  }

  private loadMessages(): void {
    this.conversationApi
      .getMessages(this.conversationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (messages) => {
          this.conversationStore.setMessages(messages);
          this.conversationStore.setIsLoadingMessages(false);
          this.scrollToBottom();
        },
        error: (error) => {
          console.error('Failed to load messages:', error);
          this.conversationStore.setError('Failed to load messages');
          this.conversationStore.setIsLoadingMessages(false);
        },
      });
  }

  private setupWebSocket(): void {
    if (!this.webSocketService.isWebSocketConnected()) {
      // Connect and then join conversation
      this.webSocketService
        .connect()
        .then(() => {
          // Connection successful, now join conversation
          return this.webSocketService.joinConversation(this.conversationId);
        })
        .then(() => {
          console.log('✅ Successfully joined conversation:', this.conversationId);
        })
        .catch((error) => {
          console.error('❌ WebSocket setup error:', error);
          this.conversationStore.setError(
            `Connection failed: ${typeof error === 'string' ? error : error?.message || 'Unknown error'}`
          );
        });
    } else {
      // Already connected, just join conversation
      this.webSocketService
        .joinConversation(this.conversationId)
        .catch((error) => {
          console.error('❌ Failed to join conversation:', error);
          this.conversationStore.setError(
            `Join failed: ${typeof error === 'string' ? error : error?.message || 'Unknown error'}`
          );
        });
    }
  }

  sendMessage(): void {
    if (!this.messageText.trim() || !this.webSocketService.isWebSocketConnected()) {
      return;
    }

    const message = this.messageText.trim();
    this.messageText = '';

    // Add user message to store
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      conversationId: this.conversationId,
      role: 'user',
      content: message,
      createdAt: new Date(),
    };
    this.conversationStore.addMessage(userMessage);

    // Start streaming
    this.uiStateStore.startStreaming();

    // Send via WebSocket
    try {
      this.webSocketService.sendPrompt(this.conversationId, message);
    } catch (error) {
      console.error('Failed to send message:', error);
      this.uiStateStore.setStreamingError('Failed to send message');
    }

    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    // Scroll to bottom with a small delay to allow rendering
    setTimeout(() => {
      const messagesContainer = document.querySelector('.messages-area');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 100);
  }

  private tryRenderSchema(): void {
    if (!this.uiHost) {
      return;
    }

    if (!this.dynamicUIService.getCurrentSchema()) {
      return;
    }

    this.dynamicUIService.renderCurrentSchema(this.uiHost);
  }
}
