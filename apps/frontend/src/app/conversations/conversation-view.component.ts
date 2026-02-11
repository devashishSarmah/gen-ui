import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
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
import { UiSchemaRendererComponent } from '../shared/components/ui-schema-renderer/ui-schema-renderer.component';
import { DynamicUIService } from '../core/services/dynamic-ui.service';

@Component({
  selector: 'app-conversation-view',
  standalone: true,
  imports: [CommonModule, FormsModule, SkeletonLoaderComponent, UiSchemaRendererComponent],
  template: `
    <div class="conversation-container">
      <div class="messages-area">
        <div class="messages">
          <ng-container *ngIf="!conversationStore.isLoadingMessages()">
            <ng-container *ngIf="conversationStore.messages().length > 0">
              <div
                *ngFor="let message of conversationStore.messages(); trackBy: trackByMessageId"
                class="message"
                [class.user]="message.role === 'user'"
                [class.assistant]="message.role === 'assistant'"
              >
                <div class="message-content">
                  <ng-container *ngIf="message.content; else uiSchemaMessage">
                    {{ message.content }}
                  </ng-container>
                  <ng-template #uiSchemaMessage>
                    <div *ngIf="message.uiSchema; else emptySchema">
                      <div class="ui-schema-container">
                        <!-- <div class="schema-preview">
                          <strong>UI Schema Generated</strong>
                          <pre>{{ message.uiSchema | json }}</pre>
                        </div> -->
                        <div class="schema-rendered">
                          <!-- <strong>Rendered UI</strong> -->
                          <app-ui-schema-renderer [schema]="message.uiSchema"></app-ui-schema-renderer>
                        </div>
                      </div>
                    </div>
                    <ng-template #emptySchema>[UI Schema]</ng-template>
                  </ng-template>
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
      :host {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
        overflow: hidden;
      }

      .conversation-container {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
        background: transparent;
      }

      .messages-area {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding: 1rem 1.25rem;
        display: flex;
        flex-direction: column;
      }

      .messages {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .message {
        display: flex;
        flex-direction: column;
        max-width: 70%;
        animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);

        &.user {
          align-self: flex-end;
          background: linear-gradient(135deg, var(--ds-accent-teal), var(--ds-accent-indigo));
          color: #0a0b0f;
          padding: 0.6rem 0.85rem;
          border-radius: var(--ds-radius-lg) var(--ds-radius-lg) 4px var(--ds-radius-lg);
          box-shadow: 0 4px 16px rgba(0, 255, 245, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1);
          font-weight: 500;
          font-size: 0.875rem;
        }

        &.assistant {
          align-self: flex-start;
          background: transparent;
          backdrop-filter: none;
          border: none;
          padding: 0;
          border-radius: 0;
          box-shadow: none;
          color: var(--ds-text-primary);
          max-width: 85%;

          &.streaming {
            background: var(--ds-surface-glass);
            backdrop-filter: blur(24px) saturate(180%);
            border: 1px solid var(--ds-border-glow);
            border-radius: var(--ds-radius-lg);
            padding: 0.75rem;
            animation: pulse 2s ease-in-out infinite;
          }
        }

        &.error {
          align-self: flex-start;
          background: linear-gradient(135deg, rgba(255, 77, 125, 0.18), rgba(255, 45, 111, 0.18));
          border: 1px solid rgba(255, 77, 125, 0.3);
          color: #ff7485;
          padding: 0.6rem 0.85rem;
          border-radius: var(--ds-radius-lg);
          box-shadow: 0 2px 8px rgba(255, 77, 125, 0.15);
          font-weight: 500;
          font-size: 0.875rem;
        }
      }

      .message-content {
        word-wrap: break-word;
        line-height: 1.4;
        font-size: 0.875rem;
      }

      .streaming-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
        font-weight: 600;
        font-size: 0.8rem;
        color: var(--ds-accent-teal);

        .progress {
          font-size: 0.875rem;
          padding: 0.25rem 0.625rem;
          background: rgba(0, 255, 245, 0.15);
          border-radius: var(--ds-radius-sm);
          font-weight: 600;
        }
      }

      .ui-schema-container {
        background: transparent;
        border: none;
        border-radius: 0;
        padding: 0;
        backdrop-filter: none;
      }

      .schema-preview {
        max-height: 300px;
        overflow-y: auto;

        strong {
          display: block;
          margin-bottom: 0.75rem;
          color: var(--ds-accent-teal);
          font-weight: 600;
          font-size: 0.875rem;
          letter-spacing: 0.02em;
        }

        pre {
          background: rgba(0, 0, 0, 0.3);
          padding: 1rem;
          border-radius: var(--ds-radius-md);
          font-size: 0.75rem;
          overflow-x: auto;
          margin: 0;
          border: 1px solid var(--ds-border);
          color: var(--ds-text-secondary);
        }
      }

      .message-time {
        font-size: 0.65rem;
        opacity: 0.6;
        margin-top: 0.25rem;
        font-weight: 500;
        letter-spacing: 0.02em;
      }

      .empty-conversation {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 1;
        color: var(--ds-text-secondary);
        text-align: center;
        font-size: 0.9rem;
      }

      .input-area {
        border-top: 1px solid var(--ds-border);
        padding: 0.75rem 1rem;
        background: var(--ds-surface-glass-strong);
        backdrop-filter: blur(32px) saturate(180%);
      }

      .connection-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.7rem;
        margin-bottom: 0.5rem;
        padding: 0.4rem 0.75rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--ds-border);
        border-radius: var(--ds-radius-md);
        font-weight: 500;
        letter-spacing: 0.02em;

        .status-indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          box-shadow: 0 0 8px currentColor;

          &.connected {
            background: var(--ds-accent-teal);
            animation: pulse-glow 2s infinite;
          }

          &.disconnected {
            background: #ff4d7d;
          }
        }
      }

      .message-form {
        display: flex;
        gap: 0.75rem;
      }

      .message-input {
        flex: 1;
        padding: 0.6rem 1rem;
        border: 1px solid var(--ds-border);
        border-radius: var(--ds-radius-pill);
        font-size: 0.85rem;
        color: var(--ds-text-primary);
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(20px) saturate(180%);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.06);

        &::placeholder {
          color: var(--ds-text-secondary);
          opacity: 0.6;
        }

        &:hover:not(:disabled) {
          border-color: var(--ds-border-strong);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1);
        }

        &:focus {
          outline: none;
          border-color: var(--ds-border-glow);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(0, 255, 245, 0.2), 0 0 32px rgba(0, 255, 245, 0.15);
        }

        &:disabled {
          background: rgba(255, 255, 255, 0.02);
          cursor: not-allowed;
          opacity: 0.5;
        }
      }

      .send-btn {
        padding: 0.6rem 1.25rem;
        background: linear-gradient(135deg, var(--ds-accent-teal), var(--ds-accent-indigo));
        color: #0a0b0f;
        border: none;
        border-radius: var(--ds-radius-pill);
        cursor: pointer;
        font-weight: 700;
        font-size: 0.85rem;
        letter-spacing: 0.02em;
        box-shadow: 0 8px 24px rgba(0, 255, 245, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;

        &::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        &:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(0, 255, 245, 0.4), 0 0 48px rgba(91, 74, 255, 0.3);
        }

        &:hover:not(:disabled)::before {
          opacity: 1;
        }

        &:active:not(:disabled) {
          transform: translateY(0);
        }

        &:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none;
        }
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(16px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes pulse {
        0%, 100% {
          opacity: 0.9;
          transform: scale(1);
        }
        50% {
          opacity: 1;
          transform: scale(1.01);
        }
      }

      @keyframes pulse-glow {
        0%, 100% {
          box-shadow: 0 0 8px currentColor;
        }
        50% {
          box-shadow: 0 0 16px currentColor, 0 0 24px currentColor;
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
  private cdr = inject(ChangeDetectorRef);

  messageText = '';
  private conversationId: string = '';

  trackByMessageId(index: number, message: Message): string {
    return message.id;
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
          this.dynamicUIService.loadSchema(chunk.data);
          const normalizedSchema = this.dynamicUIService.getCurrentSchema() ?? chunk.data;
          this.uiStateStore.completeStreaming(normalizedSchema);
          // Add a small delay to ensure the message is saved to the database
          setTimeout(() => {
            this.loadMessages(); // Reload messages to show assistant response
            this.cdr.detectChanges(); // Force change detection
          }, 300);
        } else if (chunk?.type === 'error') {
          this.uiStateStore.setStreamingError(chunk.data?.error || chunk.data?.message || 'Unknown error');
          this.cdr.detectChanges();
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
          const latestSchemaMessage = [...messages]
            .reverse()
            .find((message) => message.role === 'assistant' && message.uiSchema);
          if (latestSchemaMessage?.uiSchema) {
            this.dynamicUIService.loadSchema(latestSchemaMessage.uiSchema as any);
            const normalizedSchema =
              this.dynamicUIService.getCurrentSchema() ?? latestSchemaMessage.uiSchema;
            this.uiStateStore.completeStreaming(normalizedSchema as any);
          }
          this.scrollToBottom();
          this.cdr.detectChanges(); // Force change detection after messages load
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

}
