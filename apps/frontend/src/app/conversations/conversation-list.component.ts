import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ConversationStore, Conversation } from '../core/stores/conversation.store';
import { ConversationApiService } from '../core/services/conversation-api.service';
import { SkeletonLoaderComponent } from '../shared/components/skeleton-loader.component';

@Component({
  selector: 'app-conversation-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SkeletonLoaderComponent],
  template: `
    <div class="conversation-list-container">
      <div class="header">
        <h2>Conversations</h2>
        <button (click)="createNewConversation()" class="btn-new">
          + New
        </button>
      </div>

      <div class="search-container">
        <input
          type="text"
          [(ngModel)]="searchQuery"
          (ngModelChange)="onSearchChange($event)"
          placeholder="Search conversations..."
          class="search-input"
        />
        <span class="search-icon">🔍</span>
      </div>

      <div class="conversations">
        <ng-container *ngIf="!conversationStore.isLoadingConversations()">
          <ng-container *ngIf="filteredConversations().length > 0">
            <div
              *ngFor="let conv of filteredConversations()"
              class="conversation-item"
              [class.active]="
                conversationStore.currentConversationId() === conv.id
              "
              (click)="selectConversation(conv.id)"
            >
              <div class="conversation-info">
                <h3 [innerHTML]="highlightMatch(conv.title)"></h3>
                <p class="timestamp">
                  {{ conv.lastMessageAt | date: 'short' }}
                </p>
              </div>
              <div class="conversation-actions">
                <button
                  class="action-btn"
                  (click)="openMenu($event, conv)"
                  [attr.aria-label]="'Actions for ' + conv.title"
                >
                  ⋮
                </button>
                <div class="dropdown-menu" *ngIf="activeMenuId() === conv.id">
                  <button (click)="startRename(conv)">Rename</button>
                  <button (click)="confirmDelete(conv)" class="danger">Delete</button>
                </div>
              </div>
            </div>
          </ng-container>

          <ng-container *ngIf="filteredConversations().length === 0 && searchQuery">
            <div class="empty-state">
              <p>No conversations match "{{ searchQuery }}"</p>
            </div>
          </ng-container>

          <ng-container *ngIf="conversationStore.conversations().length === 0 && !searchQuery">
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

      <!-- Rename Modal -->
      <div class="modal-overlay" *ngIf="renameModalOpen()" (click)="closeRenameModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>Rename Conversation</h3>
          <input
            type="text"
            [(ngModel)]="newTitle"
            class="rename-input"
            placeholder="Enter new title"
            (keyup.enter)="saveRename()"
          />
          <div class="modal-actions">
            <button (click)="closeRenameModal()" class="btn-secondary">Cancel</button>
            <button (click)="saveRename()" class="btn-primary">Save</button>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div class="modal-overlay" *ngIf="deleteModalOpen()" (click)="closeDeleteModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>Delete Conversation</h3>
          <p>Are you sure you want to delete "{{ conversationToDelete()?.title }}"?</p>
          <div class="modal-actions">
            <button (click)="closeDeleteModal()" class="btn-secondary">Cancel</button>
            <button (click)="executeDelete()" class="btn-danger">Delete</button>
          </div>
        </div>
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
        padding: 1rem 1.5rem;
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

      .search-container {
        position: relative;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #e0e0e0;
      }

      .search-input {
        width: 100%;
        padding: 0.5rem 0.75rem 0.5rem 2rem;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        font-size: 0.875rem;

        &:focus {
          outline: none;
          border-color: #1976d2;
        }
      }

      .search-icon {
        position: absolute;
        left: 1.5rem;
        top: 50%;
        transform: translateY(-50%);
        font-size: 0.875rem;
      }

      .conversations {
        flex: 1;
        overflow-y: auto;
      }

      .conversation-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
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
      }

      .conversation-info {
        flex: 1;
        min-width: 0;

        h3 {
          margin: 0 0 0.25rem;
          font-size: 0.9rem;
          color: #333;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .timestamp {
          margin: 0;
          font-size: 0.75rem;
          color: #999;
        }
      }

      .conversation-actions {
        position: relative;
      }

      .action-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0.25rem 0.5rem;
        font-size: 1.25rem;
        color: #666;

        &:hover {
          background: #e0e0e0;
          border-radius: 4px;
        }
      }

      .dropdown-menu {
        position: absolute;
        right: 0;
        top: 100%;
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        z-index: 100;
        min-width: 120px;

        button {
          display: block;
          width: 100%;
          padding: 0.5rem 1rem;
          border: none;
          background: transparent;
          text-align: left;
          cursor: pointer;
          font-size: 0.875rem;

          &:hover {
            background: #f5f5f5;
          }

          &.danger {
            color: #c62828;
          }
        }
      }

      .highlight {
        background-color: #fff59d;
        font-weight: 600;
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

      .btn-secondary {
        padding: 0.5rem 1rem;
        background: #f5f5f5;
        color: #333;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        cursor: pointer;
      }

      .btn-danger {
        padding: 0.5rem 1rem;
        background: #c62828;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;

        &:hover {
          background: #b71c1c;
        }
      }

      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .modal {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        min-width: 300px;
        max-width: 400px;

        h3 {
          margin: 0 0 1rem;
        }

        p {
          margin: 0 0 1rem;
          color: #666;
        }
      }

      .rename-input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        margin-bottom: 1rem;
        font-size: 1rem;

        &:focus {
          outline: none;
          border-color: #1976d2;
        }
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
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
  private searchSubject = new Subject<string>();

  searchQuery = '';
  newTitle = '';

  activeMenuId = signal<string | null>(null);
  renameModalOpen = signal(false);
  deleteModalOpen = signal(false);
  conversationToRename = signal<Conversation | null>(null);
  conversationToDelete = signal<Conversation | null>(null);
  private outsideClickHandler = this.closeMenuOnOutsideClick.bind(this);

  filteredConversations = computed(() => {
    const conversations = this.conversationStore.conversations();
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      return conversations;
    }
    return conversations.filter((c) =>
      c.title.toLowerCase().includes(query)
    );
  });

  ngOnInit(): void {
    this.loadConversations();

    // Setup debounced search
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((query) => {
        // Search is handled reactively via computed signal
      });

    // Close menu when clicking outside
    document.addEventListener('click', this.outsideClickHandler);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('click', this.outsideClickHandler);
  }

  private closeMenuOnOutsideClick(event: Event): void {
    if (this.activeMenuId() && !(event.target as Element).closest('.conversation-actions')) {
      this.activeMenuId.set(null);
    }
  }

  onSearchChange(query: string): void {
    this.searchSubject.next(query);
  }

  highlightMatch(title: string): string {
    if (!this.searchQuery) {
      return title;
    }
    const regex = new RegExp(`(${this.escapeRegex(this.searchQuery)})`, 'gi');
    return title.replace(regex, '<span class="highlight">$1</span>');
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  openMenu(event: Event, conv: Conversation): void {
    event.stopPropagation();
    this.activeMenuId.set(this.activeMenuId() === conv.id ? null : conv.id);
  }

  startRename(conv: Conversation): void {
    this.conversationToRename.set(conv);
    this.newTitle = conv.title;
    this.renameModalOpen.set(true);
    this.activeMenuId.set(null);
  }

  closeRenameModal(): void {
    this.renameModalOpen.set(false);
    this.conversationToRename.set(null);
    this.newTitle = '';
  }

  saveRename(): void {
    const conv = this.conversationToRename();
    if (!conv || !this.newTitle.trim()) {
      return;
    }

    this.conversationApi
      .updateConversation(conv.id, { title: this.newTitle.trim() })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.conversationStore.updateConversation(conv.id, updated);
          this.closeRenameModal();
        },
        error: (error) => {
          console.error('Failed to rename conversation:', error);
          this.conversationStore.setError('Failed to rename conversation');
        },
      });
  }

  confirmDelete(conv: Conversation): void {
    this.conversationToDelete.set(conv);
    this.deleteModalOpen.set(true);
    this.activeMenuId.set(null);
  }

  closeDeleteModal(): void {
    this.deleteModalOpen.set(false);
    this.conversationToDelete.set(null);
  }

  executeDelete(): void {
    const conv = this.conversationToDelete();
    if (!conv) {
      return;
    }

    this.conversationApi
      .deleteConversation(conv.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.conversationStore.removeConversation(conv.id);
          this.closeDeleteModal();
          // If deleted conversation was active, clear selection
          if (this.conversationStore.currentConversationId() === conv.id) {
            this.conversationStore.clearCurrentConversation();
            this.router.navigate(['/conversations']);
          }
        },
        error: (error) => {
          console.error('Failed to delete conversation:', error);
          this.conversationStore.setError('Failed to delete conversation');
        },
      });
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
    this.router.navigate(['/conversations', conversationId]);
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
