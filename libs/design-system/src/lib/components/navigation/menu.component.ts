import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Menu, MenuItem, MenuTrigger } from '@angular/aria/menu';

export interface MenuAction {
  value: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  group?: string;
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, Menu, MenuItem, MenuTrigger],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Trigger button -->
    <button
      ngMenuTrigger
      [menu]="menuRef"
      class="menu-trigger"
      [class]="triggerClass"
      [disabled]="disabled"
    >
      <ng-content select="[menuTrigger]"></ng-content>
      <span *ngIf="!hasTriggerContent" class="menu-trigger-default">
        {{ triggerLabel }}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
          <path d="M3.35 4.48a.56.56 0 0 1 .8 0L6 6.33l1.85-1.85a.56.56 0 1 1 .8.8l-2.25 2.24a.56.56 0 0 1-.8 0L3.35 5.27a.56.56 0 0 1 0-.8Z"/>
        </svg>
      </span>
    </button>

    <!-- Menu popup -->
    <div
      ngMenu
      #menuRef="ngMenu"
      [wrap]="true"
      class="menu-popup"
    >
      <ng-container *ngFor="let action of actions; let i = index">
        <!-- Group separator -->
        <div
          *ngIf="action.group && i > 0 && actions[i - 1]?.group !== action.group"
          class="menu-separator"
          role="separator"
        ></div>
        <div
          *ngIf="action.group && (i === 0 || actions[i - 1]?.group !== action.group)"
          class="menu-group-label"
        >
          {{ action.group }}
        </div>
        <button
          ngMenuItem
          [value]="action.value"
          [disabled]="action.disabled ?? false"
          (click)="onItemClick(action)"
          class="menu-item"
        >
          <span *ngIf="action.icon" class="menu-item-icon" aria-hidden="true">{{ action.icon }}</span>
          <span class="menu-item-label">{{ action.label }}</span>
        </button>
      </ng-container>
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-block;
        position: relative;
      }

      .menu-trigger {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border: 1px solid var(--ds-border);
        border-radius: 999px;
        background: var(--ds-surface-glass);
        color: var(--ds-text-primary);
        font-size: 0.9rem;
        cursor: pointer;
        transition: border-color 0.2s ease, background-color 0.2s ease;
        backdrop-filter: blur(10px);
      }

      .menu-trigger:hover {
        border-color: var(--ds-border-strong);
        background-color: rgba(255, 255, 255, 0.06);
      }

      .menu-trigger:focus-visible {
        outline: none;
        box-shadow: 0 0 0 2px rgba(8, 255, 243, 0.4);
      }

      .menu-trigger:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      :host ::ng-deep [ngMenu] {
        min-width: 180px;
        padding: 0.375rem;
        border: 1px solid var(--ds-border);
        border-radius: var(--ds-radius-lg);
        background: var(--ds-surface, #101219);
        backdrop-filter: blur(20px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      }

      :host ::ng-deep [ngMenuItem] {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        width: 100%;
        padding: 0.5rem 0.75rem;
        border: none;
        border-radius: 6px;
        background: transparent;
        color: var(--ds-text-primary);
        font-size: 0.875rem;
        cursor: pointer;
        text-align: left;
        transition: background-color 0.15s ease;
      }

      :host ::ng-deep [ngMenuItem]:hover,
      :host ::ng-deep [ngMenuItem]:focus-visible {
        background-color: rgba(255, 255, 255, 0.06);
        outline: none;
      }

      :host ::ng-deep [ngMenuItem][aria-disabled='true'] {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .menu-item-icon {
        font-size: 1rem;
        min-width: 1.25rem;
        text-align: center;
      }

      .menu-separator {
        height: 1px;
        background: var(--ds-border);
        margin: 0.25rem 0.5rem;
      }

      .menu-group-label {
        padding: 0.375rem 0.75rem 0.25rem;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--ds-text-secondary);
      }

      .menu-trigger-default {
        display: flex;
        align-items: center;
        gap: 0.375rem;
      }
    `,
  ],
})
export class MenuComponent {
  @Input() actions: MenuAction[] = [];
  @Input() triggerLabel = 'Menu';
  @Input() triggerClass = '';
  @Input() disabled = false;
  @Input() hasTriggerContent = false;

  @Output() actionSelected = new EventEmitter<MenuAction>();

  @ViewChild('menuRef') menuRef!: Menu<string>;

  onItemClick(action: MenuAction) {
    if (!action.disabled) {
      this.actionSelected.emit(action);
    }
  }
}
