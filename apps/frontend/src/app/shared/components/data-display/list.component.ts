import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  imports: [CommonModule],
  template: `
    <ul class="list" [class.list-styled]="styled">
      <li *ngFor="let item of items" class="list-item" [class.list-item-clickable]="item.action">
        <div class="list-item-content">
          <span *ngIf="item.icon" class="list-item-icon">{{ item.icon }}</span>
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
      </li>
      <li *ngIf="!items || items.length === 0" class="list-empty">No items</li>
    </ul>
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
        padding: 1.25rem 1.5rem;
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
        gap: 1.25rem;
        flex: 1;
      }

      .list-item-icon {
        font-size: 1.75rem;
        min-width: 2.5rem;
        height: 2.5rem;
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
        margin-bottom: 0.375rem;
        color: var(--ds-text-primary);
        font-size: 1rem;
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
        padding: 3rem;
        text-align: center;
        color: var(--ds-text-secondary);
        font-size: 1.1rem;
        font-weight: 500;
        background: linear-gradient(135deg, rgba(0, 255, 245, 0.03), rgba(91, 74, 255, 0.03));
        border-radius: var(--ds-radius-lg);
        margin: 1rem;
      }
    `,
  ],
})
export class ListComponent {
  @Input() items: ListItem[] = [];
  @Input() styled = true;
}
