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
import { SkeletonLoaderComponent } from '@gen-ui/design-system/skeleton-loader';
import { UiSchemaRendererComponent } from '../shared/components/ui-schema-renderer/ui-schema-renderer.component';
import { DynamicUIService } from '../core/services/dynamic-ui.service';
import { InteractionService } from '../core/services/interaction.service';
import {
  LucideAngularModule,
  Bot,
  AlertCircle,
  SendHorizontal,
  Loader2,
  Sparkles,
  RefreshCw,
} from 'lucide-angular';

@Component({
  selector: 'app-conversation-view',
  standalone: true,
  imports: [CommonModule, FormsModule, SkeletonLoaderComponent, UiSchemaRendererComponent, LucideAngularModule],
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
                          <app-ui-schema-renderer
                            [schema]="message.uiSchema"
                            [conversationId]="conversationId"
                            [messageId]="message.id"
                          ></app-ui-schema-renderer>
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
                <div class="empty-panel">
                  <div class="empty-badge">
                    <lucide-icon [img]="Sparkles" [size]="14"></lucide-icon>
                    Fresh canvas
                  </div>
                  <h3>Start building this interface</h3>
                  <p>
                    Describe the layout, components, and interactions you need.
                    I will generate and stream the UI in real time.
                  </p>
                  <div class="starter-prompts">
                    <button
                      type="button"
                      class="starter-btn"
                      *ngFor="let prompt of starterPrompts"
                      (click)="sendStarterPrompt(prompt)"
                      [disabled]="uiStateStore.isStreaming() || !webSocketService.isConnected()"
                    >
                      {{ prompt }}
                    </button>
                  </div>
                </div>
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
                  <lucide-icon [img]="Bot" [size]="14"></lucide-icon>
                  Generating UI…
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
              <div class="message-content error-content">
                <div class="error-line">
                  <lucide-icon [img]="AlertCircle" [size]="14"></lucide-icon>
                  {{ uiStateStore.error() }}
                </div>
                <button
                  type="button"
                  class="retry-btn"
                  (click)="retryLastPrompt()"
                  *ngIf="canRetryPrompt()"
                  [disabled]="uiStateStore.isStreaming() || !webSocketService.isConnected()"
                >
                  <lucide-icon [img]="RefreshCw" [size]="13"></lucide-icon>
                  Retry prompt
                </button>
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
            <lucide-icon [img]="SendHorizontal" [size]="16"></lucide-icon>
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
          max-width: 95%;

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

      .error-content {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .error-line {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
      }

      .retry-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.35rem 0.75rem;
        border: 1px solid rgba(255, 116, 133, 0.35);
        border-radius: var(--ds-radius-pill);
        background: rgba(255, 255, 255, 0.06);
        color: #ffd8de;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 116, 133, 0.55);
        }

        &:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
      }

      .streaming-header {
        display: flex;
        align-items: center;
        gap: 0.35rem;
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
        background: var(--ds-surface-glass);
        border: 1px solid var(--ds-border);
        border-radius: var(--ds-radius-lg);
        padding: 0;
        backdrop-filter: blur(16px) saturate(180%);
        max-height: calc(100vh - var(--app-header-height, 60px) - var(--app-footer-height, 48px) - 180px);
        max-height: calc(100dvh - var(--app-header-height, 60px) - var(--app-footer-height, 48px) - 180px);
        overflow: auto;
        display: flex;
        flex-direction: column;
      }

      .schema-rendered {
        flex: 1;
        min-height: 0;
        overflow: auto;
        padding: 0.75rem;
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
        padding: 1rem 0;
      }

      .empty-panel {
        width: min(760px, 100%);
        border: 1px solid var(--ds-border);
        border-radius: var(--ds-radius-xl);
        background:
          radial-gradient(circle at 12% 16%, rgba(0, 255, 245, 0.12), transparent 35%),
          radial-gradient(circle at 92% 88%, rgba(91, 74, 255, 0.12), transparent 38%),
          var(--ds-surface-glass);
        backdrop-filter: blur(28px) saturate(180%);
        box-shadow: 0 18px 42px rgba(0, 0, 0, 0.26);
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.9rem;

        h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--ds-text-primary);
          letter-spacing: 0.01em;
        }

        p {
          margin: 0;
          color: var(--ds-text-secondary);
          font-size: 0.88rem;
          line-height: 1.55;
          max-width: 64ch;
        }
      }

      .empty-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        align-self: flex-start;
        background: rgba(0, 255, 245, 0.14);
        border: 1px solid rgba(0, 255, 245, 0.22);
        color: var(--ds-accent-teal);
        border-radius: var(--ds-radius-pill);
        padding: 0.3rem 0.65rem;
        font-size: 0.75rem;
        font-weight: 700;
      }

      .starter-prompts {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 0.55rem;
      }

      .starter-btn {
        border: 1px solid var(--ds-border);
        border-radius: var(--ds-radius-md);
        background: rgba(255, 255, 255, 0.04);
        color: var(--ds-text-primary);
        text-align: left;
        padding: 0.6rem 0.75rem;
        font-size: 0.78rem;
        line-height: 1.45;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover:not(:disabled) {
          border-color: var(--ds-border-glow);
          background: rgba(0, 255, 245, 0.08);
          transform: translateY(-1px);
        }

        &:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
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
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.6rem 1rem;
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

      /* ── Responsive ── */
      @media (max-width: 1024px) {
        .message {
          max-width: 85%;

          &.assistant {
            max-width: 98%;
          }
        }
      }

      @media (max-width: 768px) {
        .messages-area {
          padding: 0.75rem;
        }

        .message {
          max-width: 92%;

          &.assistant {
            max-width: 100%;
          }

          &.user {
            max-width: 88%;
          }
        }

        .ui-schema-container {
          max-height: calc(100dvh - var(--app-header-height, 60px) - var(--app-footer-height, 48px) - 160px);
        }

        .input-area {
          padding: 0.5rem 0.75rem;
        }

        .empty-panel {
          padding: 1rem;
        }

        .starter-prompts {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 480px) {
        .messages-area {
          padding: 0.5rem;
        }

        .message.user {
          padding: 0.5rem 0.7rem;
          font-size: 0.8rem;
        }

        .connection-status {
          font-size: 0.65rem;
          padding: 0.3rem 0.5rem;
        }
      }
    `,
  ],
})
export class ConversationViewComponent implements OnInit, OnDestroy {
  conversationStore = inject(ConversationStore);
  uiStateStore = inject(UIStateStore);
  webSocketService = inject(WebSocketService);

  readonly Bot = Bot;
  readonly AlertCircle = AlertCircle;
  readonly SendHorizontal = SendHorizontal;
  readonly Loader2 = Loader2;
  readonly Sparkles = Sparkles;
  readonly RefreshCw = RefreshCw;

  readonly starterPrompts: string[] = [
    'Create a compact dashboard with KPI cards and a trend chart',
    'Build a searchable customer table with filters and detail drawer',
    'Design a 3-step onboarding flow with progress and validation hints',
  ];

  private conversationApi = inject(ConversationApiService);
  private dynamicUIService = inject(DynamicUIService);
  private interactionService = inject(InteractionService);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();
  private cdr = inject(ChangeDetectorRef);

  messageText = '';
  conversationId = '';
  private lastSubmittedPrompt: string | null = null;
  private lastFailedPrompt: string | null = null;

  trackByMessageId(index: number, message: Message): string {
    return message.id;
  }

  ngOnInit(): void {
    // Get conversation ID from route
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.conversationId = params['id'];
      this.resetConversationViewState();
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
          this.interactionService.completeInteraction();
          this.lastSubmittedPrompt = null;
          this.lastFailedPrompt = null;
          // Add a small delay to ensure the message is saved to the database
          setTimeout(() => {
            this.loadMessages(); // Reload messages to show assistant response
            this.cdr.detectChanges(); // Force change detection
          }, 300);
        } else if (chunk?.type === 'error') {
          this.uiStateStore.setStreamingError(
            chunk.data?.error || chunk.data?.message || 'Unknown error'
          );
          this.interactionService.completeInteraction();
          this.lastFailedPrompt = this.lastSubmittedPrompt;
          this.lastSubmittedPrompt = null;
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
        next: () => {
          this.conversationStore.setError(null);
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
          this.conversationStore.setError(null);
          const latestSchemaMessage = [...messages]
            .reverse()
            .find((message) => message.role === 'assistant' && message.uiSchema);
          if (latestSchemaMessage?.uiSchema) {
            this.dynamicUIService.loadSchema(latestSchemaMessage.uiSchema as any);
            const normalizedSchema =
              this.dynamicUIService.getCurrentSchema() ?? latestSchemaMessage.uiSchema;
            this.uiStateStore.completeStreaming(normalizedSchema as any);
          } else if (!this.uiStateStore.error()) {
            this.dynamicUIService.clearSchema();
            this.uiStateStore.clear();
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
    this.lastSubmittedPrompt = message;
    this.lastFailedPrompt = null;
    this.conversationStore.setError(null);

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
      this.lastFailedPrompt = message;
      this.lastSubmittedPrompt = null;
    }

    this.scrollToBottom();
  }

  sendStarterPrompt(prompt: string): void {
    this.messageText = prompt;
    this.sendMessage();
  }

  canRetryPrompt(): boolean {
    return (
      !!this.lastFailedPrompt &&
      !this.uiStateStore.isStreaming() &&
      this.webSocketService.isConnected()
    );
  }

  retryLastPrompt(): void {
    if (!this.lastFailedPrompt || !this.webSocketService.isConnected()) {
      return;
    }

    const promptToRetry = this.lastFailedPrompt;
    this.lastSubmittedPrompt = promptToRetry;
    this.conversationStore.setError(null);
    this.uiStateStore.startStreaming();

    try {
      this.webSocketService.sendPrompt(this.conversationId, promptToRetry);
    } catch (error) {
      console.error('Failed to retry prompt:', error);
      this.uiStateStore.setStreamingError('Failed to retry prompt');
      this.lastFailedPrompt = promptToRetry;
      this.lastSubmittedPrompt = null;
    }

    this.scrollToBottom();
  }

  private resetConversationViewState(): void {
    this.messageText = '';
    this.lastSubmittedPrompt = null;
    this.lastFailedPrompt = null;
    this.conversationStore.setError(null);
    this.conversationStore.setMessages([]);
    this.uiStateStore.clear();
    this.dynamicUIService.clearSchema();
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
