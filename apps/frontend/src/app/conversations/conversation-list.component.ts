import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ConversationStore, Conversation } from '../core/stores/conversation.store';
import { ConversationApiService } from '../core/services/conversation-api.service';
import { UIStateStore } from '../core/stores/ui.store';
import { DynamicUIService } from '../core/services/dynamic-ui.service';
import { SkeletonLoaderComponent } from '@gen-ui/design-system/skeleton-loader';
import {
  LucideAngularModule,
  Search,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  MessageSquare,
} from 'lucide-angular';

@Component({
  selector: 'app-conversation-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SkeletonLoaderComponent, LucideAngularModule],
  template: `
    <div class="conversation-list-container">
      <div class="header">
        <h2>Conversations</h2>
        <button (click)="createNewConversation()" class="btn-new">
          <lucide-icon [img]="Plus" [size]="14"></lucide-icon>
          New
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
        <span class="search-icon">
          <lucide-icon [img]="Search" [size]="13"></lucide-icon>
        </span>
      </div>

      <div class="conversations" #conversationsScroller (scroll)="onConversationScroll()">
        <ng-container *ngIf="!conversationStore.isLoadingConversations()">
          <ng-container *ngIf="filteredConversations().length > 0">
            <div
              *ngFor="let conv of filteredConversations()"
              class="conversation-item"
              [class.menu-open]="activeMenuId() === conv.id"
              [class.active]="
                conversationStore.currentConversationId() === conv.id
              "
              (click)="onConversationItemClick($event, conv.id)"
            >
              <div class="conversation-info">
                <h3 [innerHTML]="highlightMatch(conv.title)"></h3>
                <p class="timestamp">
                  {{ conv.lastMessageAt | date: 'short' }}
                </p>
              </div>
              <div class="conversation-actions" [attr.data-conversation-id]="conv.id">
                <button
                  type="button"
                  class="action-btn"
                  (mousedown)="preventConversationSelection($event)"
                  (click)="openMenu($event, conv)"
                  [attr.aria-label]="'Actions for ' + conv.title"
                >
                  <lucide-icon [img]="MoreVertical" [size]="14"></lucide-icon>
                </button>
                <div
                  class="dropdown-menu"
                  [class.open-up]="menuOpensUp()"
                  [attr.data-conversation-id]="conv.id"
                  *ngIf="activeMenuId() === conv.id"
                  (click)="preventConversationSelection($event)"
                >
                  <button type="button" (mousedown)="preventConversationSelection($event)" (click)="startRename(conv)"><lucide-icon [img]="Pencil" [size]="13"></lucide-icon> Rename</button>
                  <button type="button" (mousedown)="preventConversationSelection($event)" (click)="confirmDelete(conv)" class="danger"><lucide-icon [img]="Trash2" [size]="13"></lucide-icon> Delete</button>
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
              <div class="empty-icon-ring">
                <lucide-icon [img]="MessageSquare" [size]="24"></lucide-icon>
              </div>
              <p class="empty-title">No conversations yet</p>
              <p class="empty-hint">Start chatting to generate your first UI</p>
              <button (click)="createNewConversation()" class="btn-primary empty-state-cta">
                <span class="cta-icon">
                  <lucide-icon [img]="Plus" [size]="14"></lucide-icon>
                </span>
                <span class="cta-label">New Conversation</span>
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
        background: var(--ds-surface-glass);
        border-right: 1px solid var(--ds-border);
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.65rem 1rem;
        background: linear-gradient(135deg, rgba(0, 255, 245, 0.08), rgba(91, 74, 255, 0.08));
        backdrop-filter: blur(32px);
        border-bottom: 1px solid var(--ds-border);

        h2 {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 700;
          background: linear-gradient(135deg, var(--ds-accent-teal), var(--ds-accent-indigo));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      }

      .btn-new {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.4rem 0.85rem;
        background: linear-gradient(135deg, var(--ds-accent-teal), var(--ds-accent-indigo));
        color: #0a0b0f;
        border: none;
        border-radius: var(--ds-radius-pill);
        cursor: pointer;
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0.02em;
        box-shadow: 0 4px 16px rgba(0, 255, 245, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1);
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

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 255, 245, 0.35), 0 0 32px rgba(91, 74, 255, 0.25);
        }

        &:hover::before {
          opacity: 1;
        }

        &:active {
          transform: translateY(0);
        }
      }

      .search-container {
        position: relative;
        padding: 0.5rem 0.75rem;
        border-bottom: 1px solid var(--ds-border);
      }

      .search-input {
        width: 100%;
        padding: 0.5rem 0.75rem 0.5rem 2rem;
        border: 1px solid var(--ds-border);
        border-radius: var(--ds-radius-pill);
        font-size: 0.8rem;
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(16px);
        color: var(--ds-text-primary);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.06);

        &::placeholder {
          color: var(--ds-text-secondary);
          opacity: 0.6;
        }

        &:focus {
          outline: none;
          border-color: var(--ds-border-glow);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2), 0 0 0 2px rgba(0, 255, 245, 0.15), 0 0 24px rgba(0, 255, 245, 0.1);
        }

        &:hover:not(:focus) {
          border-color: var(--ds-border-strong);
          box-shadow: 0 5px 14px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(255, 255, 255, 0.08);
        }
      }

      .search-icon {
        position: absolute;
        left: 1.4rem;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        align-items: center;
        color: var(--ds-text-secondary);
        opacity: 0.5;
      }

      .conversations {
        flex: 1;
        overflow-y: auto;
        padding: 0.5rem 0;
      }

      .conversation-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0.85rem;
        margin: 0.15rem 0.5rem;
        border-radius: var(--ds-radius-md);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        z-index: 0;

        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          border-radius: 0 var(--ds-radius-sm) var(--ds-radius-sm) 0;
          background: transparent;
          transition: background 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        &:hover {
          background: rgba(255, 255, 255, 0.06);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transform: translateX(4px);
          z-index: 1;
        }

        &.active {
          background: linear-gradient(135deg, rgba(0, 255, 245, 0.12), rgba(91, 74, 255, 0.12));
          border: 1px solid var(--ds-border-glow);
          box-shadow: 0 4px 16px rgba(0, 255, 245, 0.2), 0 0 24px rgba(91, 74, 255, 0.15);

          &::before {
            background: linear-gradient(180deg, var(--ds-accent-teal), var(--ds-accent-indigo));
            box-shadow: 0 0 12px currentColor;
          }
        }

        &.menu-open {
          z-index: 40;
          transform: none;
        }
      }

      .conversation-info {
        flex: 1;
        min-width: 0;

        h3 {
          margin: 0 0 0.2rem;
          font-size: 0.8rem;
          color: var(--ds-text-primary);
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          letter-spacing: 0.01em;
        }

        .timestamp {
          margin: 0;
          font-size: 0.65rem;
          color: var(--ds-text-secondary);
          opacity: 0.8;
          font-weight: 500;
        }
      }

      .conversation-actions {
        position: relative;
        z-index: 5;
      }

      .action-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0.375rem 0.625rem;
        font-size: 1.25rem;
        color: var(--ds-text-secondary);
        border-radius: var(--ds-radius-md);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--ds-accent-teal);
          box-shadow: 0 0 16px rgba(0, 255, 245, 0.2);
        }
      }

      .dropdown-menu {
        position: absolute;
        right: 0;
        top: calc(100% + 0.5rem);
        background: var(--ds-surface-glass-strong);
        backdrop-filter: blur(32px) saturate(180%);
        border: 1px solid var(--ds-border);
        border-radius: var(--ds-radius-lg);
        box-shadow: var(--ds-shadow-medium), 0 0 32px rgba(0, 0, 0, 0.3);
        z-index: 120;
        min-width: 140px;
        overflow: hidden;
        transform-origin: top right;
        animation: dropdownFadeInDown 0.25s cubic-bezier(0.4, 0, 0.2, 1);

        &.open-up {
          top: auto;
          bottom: calc(100% + 0.5rem);
          transform-origin: bottom right;
          animation: dropdownFadeInUp 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.75rem 1rem;
          border: none;
          background: transparent;
          text-align: left;
          cursor: pointer;
          font-size: 0.875rem;
          color: var(--ds-text-primary);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          font-weight: 500;

          &:last-child {
            border-bottom: none;
          }

          &:hover {
            background: rgba(255, 255, 255, 0.08);
            transform: translateX(4px);
          }

          &.danger {
            color: #ff4d7d;

            &:hover {
              background: rgba(255, 77, 125, 0.15);
            }
          }
        }
      }

      .highlight {
        background: linear-gradient(135deg, var(--ds-accent-teal), var(--ds-accent-indigo));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        font-weight: 700;
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2.5rem 1.5rem;
        text-align: center;
        color: var(--ds-text-secondary);

        p {
          margin-bottom: 0.75rem;
          font-size: 0.85rem;
        }
      }

      .empty-icon-ring {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 52px;
        height: 52px;
        border-radius: 50%;
        background: linear-gradient(135deg, rgba(0, 255, 245, 0.08), rgba(91, 74, 255, 0.08));
        border: 1px solid var(--ds-border);
        color: var(--ds-accent-teal);
        margin-bottom: 0.75rem;
        opacity: 0.8;
      }

      .empty-title {
        font-size: 0.9rem !important;
        font-weight: 600;
        color: var(--ds-text-primary);
        margin-bottom: 0.15rem !important;
      }

      .empty-hint {
        font-size: 0.75rem !important;
        opacity: 0.6;
        margin-bottom: 1rem !important;
      }

      .btn-primary {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.35rem;
        white-space: nowrap;
        padding: 0.5rem 1.25rem;
        background: linear-gradient(135deg, var(--ds-accent-teal), var(--ds-accent-indigo));
        color: #0a0b0f;
        border: none;
        border-radius: var(--ds-radius-pill);
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: 700;
        letter-spacing: 0.02em;
        box-shadow: 0 8px 24px rgba(0, 255, 245, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(0, 255, 245, 0.4), 0 0 48px rgba(91, 74, 255, 0.3);
        }

        &:active {
          transform: translateY(0);
        }

        lucide-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
      }

      .empty-state-cta {
        display: inline-grid;
        grid-auto-flow: column;
        grid-auto-columns: max-content;
        align-items: center;
        column-gap: 0.45rem;
        justify-content: center;
        white-space: nowrap;
      }

      .empty-state-cta .cta-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 14px;
        height: 14px;
        line-height: 0;
      }

      .empty-state-cta .cta-label {
        display: inline-block;
        white-space: nowrap;
        line-height: 1;
      }

      .btn-secondary {
        padding: 0.75rem 1.25rem;
        background: rgba(255, 255, 255, 0.05);
        color: var(--ds-text-primary);
        border: 1px solid var(--ds-border);
        border-radius: var(--ds-radius-pill);
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: var(--ds-border-strong);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
      }

      .btn-danger {
        padding: 0.75rem 1.25rem;
        background: linear-gradient(135deg, #ff4d7d, #ff2d6f);
        color: white;
        border: none;
        border-radius: var(--ds-radius-pill);
        cursor: pointer;
        font-weight: 700;
        letter-spacing: 0.02em;
        box-shadow: 0 6px 20px rgba(255, 77, 125, 0.3);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(255, 77, 125, 0.4), 0 0 40px rgba(255, 45, 111, 0.25);
        }

        &:active {
          transform: translateY(0);
        }
      }

      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100dvw;
        height: 100dvh;
        background: rgba(0, 0, 0, 0.75);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        z-index: 4000;
        animation: overlayFadeIn 0.3s ease;
      }

      .modal {
        background: var(--ds-surface-glass-strong);
        backdrop-filter: blur(32px) saturate(180%);
        padding: 1.25rem;
        border-radius: var(--ds-radius-xl);
        border: 1px solid var(--ds-border);
        box-shadow: var(--ds-shadow-medium), 0 0 64px rgba(0, 0, 0, 0.5);
        width: min(400px, calc(100dvw - 2rem));
        animation: modalSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        h3 {
          margin: 0 0 0.75rem;
          font-size: 1rem;
          font-weight: 700;
          background: linear-gradient(135deg, var(--ds-accent-teal), var(--ds-accent-indigo));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        p {
          margin: 0 0 1.5rem;
          color: var(--ds-text-secondary);
          line-height: 1.6;
        }
      }

      .rename-input {
        width: 100%;
        padding: 0.875rem 1.25rem;
        border: 1px solid var(--ds-border);
        border-radius: var(--ds-radius-pill);
        margin-bottom: 1.5rem;
        font-size: 1rem;
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(16px);
        color: var(--ds-text-primary);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:focus {
          outline: none;
          border-color: var(--ds-border-glow);
          box-shadow: 0 0 0 2px rgba(0, 255, 245, 0.15), 0 0 24px rgba(0, 255, 245, 0.1);
        }
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
      }

      .error {
        padding: 1.25rem;
        background: linear-gradient(135deg, rgba(255, 77, 125, 0.18), rgba(255, 45, 111, 0.18));
        border-top: 1px solid rgba(255, 77, 125, 0.3);
        color: #ff7485;
        font-weight: 500;
        letter-spacing: 0.01em;
      }

      @keyframes dropdownFadeInDown {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes dropdownFadeInUp {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes overlayFadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes modalSlideIn {
        from {
          opacity: 0;
          transform: scale(0.95) translateY(-16px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
    `,
  ],
})
export class ConversationListComponent implements OnInit, OnDestroy {
  @ViewChild('conversationsScroller', { static: true })
  private conversationsScroller?: ElementRef<HTMLElement>;

  conversationStore = inject(ConversationStore);
  uiStateStore = inject(UIStateStore);
  private conversationApi = inject(ConversationApiService);
  private dynamicUIService = inject(DynamicUIService);

  readonly Search = Search;
  readonly Plus = Plus;
  readonly MoreVertical = MoreVertical;
  readonly Pencil = Pencil;
  readonly Trash2 = Trash2;
  readonly MessageSquare = MessageSquare;
  private router = inject(Router);
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  searchQuery = '';
  newTitle = '';

  activeMenuId = signal<string | null>(null);
  menuOpensUp = signal(false);
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
      this.closeActiveMenu();
    }
  }

  preventConversationSelection(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
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
    this.preventConversationSelection(event);
    if (this.activeMenuId() === conv.id) {
      this.closeActiveMenu();
      return;
    }

    this.activeMenuId.set(conv.id);
    this.menuOpensUp.set(false);
    requestAnimationFrame(() => this.updateDropdownDirection(conv.id));
  }

  onConversationScroll(): void {
    const activeId = this.activeMenuId();
    if (!activeId) {
      return;
    }
    requestAnimationFrame(() => this.updateDropdownDirection(activeId));
  }

  onConversationItemClick(event: Event, conversationId: string): void {
    const target = event.target as HTMLElement;
    if (target.closest('.conversation-actions') || target.closest('.dropdown-menu')) {
      return;
    }

    if (this.activeMenuId()) {
      this.closeActiveMenu();
      return;
    }

    this.selectConversation(conversationId);
  }

  startRename(conv: Conversation): void {
    this.conversationToRename.set(conv);
    this.newTitle = conv.title;
    this.renameModalOpen.set(true);
    this.closeActiveMenu();
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
    this.closeActiveMenu();
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
          this.conversationStore.setError(null);
        },
        error: (error) => {
          console.error('Failed to load conversations:', error);
          this.conversationStore.setError('Failed to load conversations');
          this.conversationStore.setIsLoadingConversations(false);
        },
      });
  }

  selectConversation(conversationId: string): void {
    this.conversationStore.setError(null);
    this.uiStateStore.clear();
    this.dynamicUIService.clearSchema();
    this.conversationStore.setCurrentConversation(conversationId);
    this.router.navigate(['/conversations', conversationId]);
  }

  createNewConversation(): void {
    this.conversationStore.setError(null);
    this.uiStateStore.clear();
    this.dynamicUIService.clearSchema();
    sessionStorage.removeItem('pendingPrompt');

    this.conversationApi
      .createConversation()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (conversation) => {
          this.conversationStore.conversations.update((convs) => [conversation, ...convs]);
          this.conversationStore.setError(null);
          this.selectConversation(conversation.id);
        },
        error: (error) => {
          console.error('Failed to create conversation:', error);
          this.conversationStore.setError('Failed to create conversation');
        },
      });
  }

  private closeActiveMenu(): void {
    this.activeMenuId.set(null);
    this.menuOpensUp.set(false);
  }

  private updateDropdownDirection(conversationId: string): void {
    const scroller = this.conversationsScroller?.nativeElement;
    if (!scroller || this.activeMenuId() !== conversationId) {
      return;
    }

    const selectorId = typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
      ? CSS.escape(conversationId)
      : conversationId;

    const actionsEl = scroller.querySelector(
      `.conversation-actions[data-conversation-id="${selectorId}"]`
    ) as HTMLElement | null;
    const menuEl = scroller.querySelector(
      `.dropdown-menu[data-conversation-id="${selectorId}"]`
    ) as HTMLElement | null;

    if (!actionsEl || !menuEl) {
      return;
    }

    const scrollerRect = scroller.getBoundingClientRect();
    const actionsRect = actionsEl.getBoundingClientRect();
    const menuHeight = menuEl.offsetHeight || 96;
    const minGap = 8;
    const spaceBelow = scrollerRect.bottom - actionsRect.bottom - minGap;
    const spaceAbove = actionsRect.top - scrollerRect.top - minGap;

    const shouldOpenUp = spaceBelow < menuHeight && spaceAbove > spaceBelow;
    this.menuOpensUp.set(shouldOpenUp);
  }
}
