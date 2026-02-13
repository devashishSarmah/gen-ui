import { Component, Input, OnInit, OnChanges, SimpleChanges, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { DsIconComponent } from '../shared/ds-icon.component';

export interface ListItem {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  action?: () => void;
}

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [CommonModule, ScrollingModule, DsIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="list" [class.list-styled]="styled">
      <!-- Virtual scroll for large lists (>100 items) -->
      <ng-container *ngIf="useVirtualScroll(); else normalList">
        <cdk-virtual-scroll-viewport
          [itemSize]="itemHeight"
          [style.height.px]="viewportHeight"
          class="virtual-viewport"
        >
          <li *cdkVirtualFor="let item of displayItems()" class="list-item" [class.list-item-clickable]="item.action">
            <ng-container *ngTemplateOutlet="itemTpl; context: { $implicit: item }"></ng-container>
          </li>
        </cdk-virtual-scroll-viewport>
      </ng-container>
      <ng-template #normalList>
        <li *ngFor="let item of displayItems()" class="list-item" [class.list-item-clickable]="item.action">
          <ng-container *ngTemplateOutlet="itemTpl; context: { $implicit: item }"></ng-container>
        </li>
      </ng-template>
      <li *ngIf="displayItems().length === 0" class="list-empty">
        {{ items.length > 0 ? 'No matching results' : 'No items' }}
      </li>
    </ul>

    <ng-template #itemTpl let-item>
      <div class="list-item-content">
        <span *ngIf="item.icon" class="list-item-icon"><ds-icon [name]="item.icon" [size]="16"></ds-icon></span>
        <div class="list-item-text">
          <div class="list-item-label">{{ item.label }}</div>
          <div *ngIf="item.description" class="list-item-description">
            {{ item.description }}
          </div>
        </div>
      </div>
      <button
        *ngIf="item.action"
        (click)="item.action()"
        class="list-item-action"
        type="button"
        [attr.aria-label]="'Open ' + item.label"
      >
        →
      </button>
    </ng-template>
  `,
  styles: [
    `
      .list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .list-styled {
        background: var(--ds-surface-glass-strong);
        backdrop-filter: blur(32px) saturate(180%);
        border: 1px solid var(--ds-border);
        border-radius: var(--ds-radius-xl);
        overflow: hidden;
        box-shadow: var(--ds-shadow-medium), 0 0 0 1px rgba(255, 255, 255, 0.06);
      }

      .list-item {
        padding: 0.625rem 0.875rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;

        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: transparent;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      }

      .list-item:last-child {
        border-bottom: none;
      }

      .list-item-clickable {
        cursor: pointer;

        &:hover {
          background: linear-gradient(135deg, rgba(0, 255, 245, 0.08), rgba(91, 74, 255, 0.08));
          transform: translateX(8px);
          box-shadow: inset 0 0 0 1px rgba(0, 255, 245, 0.15);

          &::before {
            background: linear-gradient(180deg, var(--ds-accent-teal), var(--ds-accent-indigo));
            box-shadow: 0 0 12px var(--ds-accent-teal);
          }
        }

        &:active {
          transform: translateX(4px);
        }
      }

      .list-item-content {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        flex: 1;
      }

      .list-item-icon {
        font-size: 1rem;
        min-width: 1.75rem;
        height: 1.75rem;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, rgba(0, 255, 245, 0.1), rgba(91, 74, 255, 0.1));
        border-radius: var(--ds-radius-md);
        border: 1px solid rgba(0, 255, 245, 0.2);
        box-shadow: 0 4px 12px rgba(0, 255, 245, 0.15), inset 0 0 20px rgba(0, 255, 245, 0.05);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .list-item-clickable:hover .list-item-icon {
        transform: scale(1.1);
        box-shadow: 0 6px 20px rgba(0, 255, 245, 0.3), 0 0 32px rgba(91, 74, 255, 0.2);
        border-color: var(--ds-accent-teal);
      }

      .list-item-text {
        flex: 1;
      }

      .list-item-label {
        font-weight: 600;
        margin-bottom: 0.25rem;
        color: var(--ds-text-primary);
        font-size: 0.825rem;
        letter-spacing: 0.01em;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .list-item-clickable:hover .list-item-label {
        background: linear-gradient(135deg, var(--ds-accent-teal), var(--ds-accent-indigo));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        filter: drop-shadow(0 0 12px rgba(0, 255, 245, 0.5));
      }

      .list-item-description {
        font-size: 0.875rem;
        color: var(--ds-text-secondary);
        line-height: 1.5;
        opacity: 0.9;
      }

      .list-item-action {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(16px);
        border: 1px solid var(--ds-border);
        border-radius: var(--ds-radius-md);
        cursor: pointer;
        font-size: 1.25rem;
        color: var(--ds-text-secondary);
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

        &:hover {
          color: var(--ds-accent-teal);
          background: linear-gradient(135deg, rgba(0, 255, 245, 0.15), rgba(91, 74, 255, 0.15));
          border-color: var(--ds-border-glow);
          transform: translateX(4px) scale(1.1);
          box-shadow: 0 6px 20px rgba(0, 255, 245, 0.3), 0 0 24px rgba(0, 255, 245, 0.2);
        }

        &:active {
          transform: translateX(2px) scale(1.05);
        }
      }

      .list-empty {
        padding: 1.5rem;
        text-align: center;
        color: var(--ds-text-secondary);
        font-size: 0.85rem;
        font-weight: 500;
        background: linear-gradient(135deg, rgba(0, 255, 245, 0.03), rgba(91, 74, 255, 0.03));
        border-radius: var(--ds-radius-lg);
        margin: 1rem;
      }
    `,
  ],
})
export class ListComponent implements OnInit, OnChanges {
  @Input() items: ListItem[] = [];
  @Input() styled = true;
  @Input() itemHeight = 48;
  @Input() maxVisibleItems = 15;

  private readonly dataSignal = signal<ListItem[]>([]);
  readonly displayItems = computed(() => this.dataSignal());
  readonly useVirtualScroll = computed(() => this.dataSignal().length > 100);

  get viewportHeight(): number {
    return this.itemHeight * Math.min(this.maxVisibleItems, this.dataSignal().length);
  }

  ngOnInit(): void {
    this.dataSignal.set(this.items);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      this.dataSignal.set(this.items);
    }
  }

  /** Called by InteractionService / ClientDataEngine to update displayed data. */
  updateData(filteredItems: ListItem[]): void {
    this.dataSignal.set(filteredItems);
  }
}
