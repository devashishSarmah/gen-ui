import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Toolbar } from '@angular/aria/toolbar';

export interface ToolbarItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  group?: string;
}

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule, Toolbar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      ngToolbar
      [orientation]="orientation"
      [wrap]="wrap"
      class="toolbar-wrapper"
      [attr.aria-label]="ariaLabel"
    >
      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
      :host ::ng-deep [ngToolbar] {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.375rem;
        border: 1px solid var(--ds-border);
        border-radius: var(--ds-radius-lg);
        background: var(--ds-surface-glass);
        backdrop-filter: blur(14px);
      }

      :host ::ng-deep [ngToolbar][aria-orientation='vertical'] {
        flex-direction: column;
      }

      :host ::ng-deep [ngToolbarWidget] {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 2rem;
        min-height: 2rem;
        padding: 0.375rem 0.625rem;
        border: none;
        border-radius: 6px;
        background: transparent;
        color: var(--ds-text-secondary);
        font-size: 0.875rem;
        cursor: pointer;
        transition: background-color 0.15s ease, color 0.15s ease;
      }

      :host ::ng-deep [ngToolbarWidget]:hover {
        background-color: rgba(255, 255, 255, 0.06);
        color: var(--ds-text-primary);
      }

      :host ::ng-deep [ngToolbarWidget]:focus-visible {
        outline: none;
        box-shadow: 0 0 0 2px rgba(8, 255, 243, 0.4);
      }

      :host ::ng-deep [ngToolbarWidget][aria-pressed='true'],
      :host ::ng-deep [ngToolbarWidget].active {
        background: linear-gradient(
          135deg,
          rgba(8, 255, 243, 0.15) 0%,
          rgba(77, 58, 255, 0.15) 100%
        );
        color: var(--ds-accent-teal);
      }

      :host ::ng-deep [ngToolbarWidget][aria-disabled='true'] {
        opacity: 0.4;
        cursor: not-allowed;
      }

      :host ::ng-deep [ngToolbarWidgetGroup] {
        display: flex;
        align-items: center;
        gap: 0.125rem;
        padding: 0 0.25rem;
        border-left: 1px solid var(--ds-border);
        border-right: 1px solid var(--ds-border);
        margin: 0 0.25rem;
      }

      :host ::ng-deep [ngToolbarWidgetGroup]:first-child {
        border-left: none;
        margin-left: 0;
        padding-left: 0;
      }

      :host ::ng-deep [ngToolbarWidgetGroup]:last-child {
        border-right: none;
        margin-right: 0;
        padding-right: 0;
      }
    `,
  ],
})
export class ToolbarComponent {
  @Input() orientation: 'horizontal' | 'vertical' = 'horizontal';
  @Input() wrap = true;
  @Input() ariaLabel = 'Toolbar';
}
