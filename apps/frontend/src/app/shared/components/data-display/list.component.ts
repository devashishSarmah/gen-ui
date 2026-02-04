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
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        overflow: hidden;
      }

      .list-item {
        padding: 1rem;
        border-bottom: 1px solid #e0e0e0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: background-color 0.2s ease;
      }

      .list-item:last-child {
        border-bottom: none;
      }

      .list-item-clickable {
        cursor: pointer;
      }

      .list-item:hover.list-item-clickable {
        background-color: #f9f9f9;
      }

      .list-item-content {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex: 1;
      }

      .list-item-icon {
        font-size: 1.5rem;
        min-width: 2rem;
        text-align: center;
      }

      .list-item-text {
        flex: 1;
      }

      .list-item-label {
        font-weight: 500;
        margin-bottom: 0.25rem;
      }

      .list-item-description {
        font-size: 0.875rem;
        color: #666;
      }

      .list-item-action {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1.25rem;
        color: #666;
        transition: color 0.2s ease;
      }

      .list-item-action:hover {
        color: #2196f3;
      }

      .list-empty {
        padding: 2rem;
        text-align: center;
        color: #999;
      }
    `,
  ],
})
export class ListComponent {
  @Input() items: ListItem[] = [];
  @Input() styled = true;
}
