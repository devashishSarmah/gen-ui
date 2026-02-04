import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ConversationStore, Conversation } from '../../core/stores/conversation.store';
import { ConversationApiService } from '../../core/services/conversation-api.service';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader.component';

@Component({
  selector: 'app-conversation-list',
  standalone: true,
  imports: [CommonModule, RouterModule, SkeletonLoaderComponent],
  template: `
    <div class="conversation-list-container">
      <div class="header">
        <h2>Conversations</h2>
        <button (click)="createNewConversation()" class="btn-new">
          + New Conversation
        </button>
      </div>

      <div class="conversations">
        <ng-container *ngIf="!conversationStore.isLoadingConversations()">
          <ng-container *ngIf="conversationStore.conversations().length > 0">
            <div
              *ngFor="let conv of conversationStore.conversations()"
              class="conversation-item"
              [class.active]="
                conversationStore.currentConversationId() === conv.id
              "
              (click)="selectConversation(conv.id)"
            >
              <h3>{{ conv.title }}</h3>
              <p class="timestamp">
                {{ conv.lastMessageAt | date: 'short' }}
              </p>
            </div>
          </ng-container>

          <ng-container *ngIf="conversationStore.conversations().length === 0">
            <div class="empty-state">
              <p>No conversations yet</p>
              <button (click)="createNewConversation()" class="btn-primary">
                Start a new conversation
              </button>
            </div>
          </ng-container>
        </ng-container>

        <ng-container *ngIf="conversationStore.isLoadingConversations()">
          <app-skeleton-loader type="list"></app-skeleton-loader>
          <app-skeleton-loader type="list"></app-skeleton-loader>
          <app-skeleton-loader type="list"></app-skeleton-loader>
        </ng-container>
      </div>

      <div class="error" *ngIf="conversationStore.error()">
        {{ conversationStore.error() }}
      </div>
    </div>
  `,
  styles: [
    `
      .conversation-list-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: white;
        border-right: 1px solid #e0e0e0;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid #e0e0e0;

        h2 {
          margin: 0;
          font-size: 1.25rem;
        }
      }

      .btn-new {
        padding: 0.5rem 1rem;
        background: #1976d2;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.875rem;

        &:hover {
          background: #1565c0;
        }
      }

      .conversations {
        flex: 1;
        overflow-y: auto;
      }

      .conversation-item {
        padding: 1rem 1.5rem;
        border-bottom: 1px solid #f0f0f0;
        cursor: pointer;
        transition: background-color 0.2s ease;

        &:hover {
          background-color: #f5f5f5;
        }

        &.active {
          background-color: #e3f2fd;
          border-left: 3px solid #1976d2;
        }

        h3 {
          margin: 0 0 0.5rem;
          font-size: 1rem;
          color: #333;
        }

        .timestamp {
          margin: 0;
          font-size: 0.75rem;
          color: #999;
        }
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        text-align: center;
        color: #999;

        p {
          margin-bottom: 1rem;
        }
      }

      .btn-primary {
        padding: 0.75rem 1.5rem;
        background: #1976d2;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;

        &:hover {
          background: #1565c0;
        }
      }

      .error {
        padding: 1rem;
        background: #ffebee;
        color: #c62828;
        border-top: 1px solid #ef5350;
      }
    `,
  ],
})
export class ConversationListComponent implements OnInit, OnDestroy {
  conversationStore = inject(ConversationStore);
  private conversationApi = inject(ConversationApiService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadConversations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadConversations(): void {
    this.conversationStore.setIsLoadingConversations(true);

    this.conversationApi
      .getConversations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (conversations) => {
          this.conversationStore.setConversations(conversations);
          this.conversationStore.setIsLoadingConversations(false);
        },
        error: (error) => {
          console.error('Failed to load conversations:', error);
          this.conversationStore.setError('Failed to load conversations');
          this.conversationStore.setIsLoadingConversations(false);
        },
      });
  }

  selectConversation(conversationId: string): void {
    this.conversationStore.setCurrentConversation(conversationId);
    this.router.navigate([
      {
        outlets: {
          primary: ['conversations', conversationId],
          list: ['conversations'],
        },
      },
    ]);
  }

  createNewConversation(): void {
    this.conversationApi
      .createConversation()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (conversation) => {
          this.conversationStore.conversations.update((convs) => [conversation, ...convs]);
          this.selectConversation(conversation.id);
        },
        error: (error) => {
          console.error('Failed to create conversation:', error);
          this.conversationStore.setError('Failed to create conversation');
        },
      });
  }
}
