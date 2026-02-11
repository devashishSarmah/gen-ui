import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span 
      class="badge"
      [class.primary]="variant === 'primary'"
      [class.secondary]="variant === 'secondary'"
      [class.success]="variant === 'success'"
      [class.warning]="variant === 'warning'"
      [class.danger]="variant === 'danger'"
      [class.info]="variant === 'info'"
      [class.small]="size === 'small'"
      [class.medium]="size === 'medium'"
      [class.large]="size === 'large'"
      [class.pill]="pill"
    >
      <span class="badge-icon" *ngIf="icon">{{ icon }}</span>
      <span class="badge-text">{{ text }}</span>
      <button 
        *ngIf="dismissible" 
        class="badge-close" 
        (click)="onDismiss()"
        type="button"
        aria-label="Dismiss"
      >×</button>
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      font-weight: 600;
      border-radius: var(--ds-radius-md);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid transparent;
      white-space: nowrap;
    }

    .badge.pill {
      border-radius: var(--ds-radius-pill);
    }

    .badge.small {
      padding: 0.25rem 0.625rem;
      font-size: 0.7rem;
      letter-spacing: 0.03em;
    }

    .badge.medium {
      padding: 0.375rem 0.875rem;
      font-size: 0.8rem;
      letter-spacing: 0.02em;
    }

    .badge.large {
      padding: 0.5rem 1.125rem;
      font-size: 0.9rem;
      letter-spacing: 0.02em;
    }

    .badge.primary {
      background: linear-gradient(135deg, rgba(0, 255, 245, 0.15), rgba(91, 74, 255, 0.15));
      color: var(--ds-accent-teal);
      border-color: rgba(0, 255, 245, 0.3);
    }

    .badge.secondary {
      background: rgba(255, 255, 255, 0.1);
      color: var(--ds-text-secondary);
      border-color: var(--ds-border);
    }

    .badge.success {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      border-color: rgba(16, 185, 129, 0.3);
    }

    .badge.warning {
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
      border-color: rgba(245, 158, 11, 0.3);
    }

    .badge.danger {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
      border-color: rgba(239, 68, 68, 0.3);
    }

    .badge.info {
      background: rgba(59, 130, 246, 0.15);
      color: #3b82f6;
      border-color: rgba(59, 130, 246, 0.3);
    }

    .badge-icon {
      font-size: 1em;
      line-height: 1;
    }

    .badge-text {
      line-height: 1;
      text-transform: uppercase;
    }

    .badge-close {
      background: none;
      border: none;
      color: currentColor;
      font-size: 1.25em;
      line-height: 1;
      cursor: pointer;
      padding: 0;
      margin-left: 0.125rem;
      opacity: 0.7;
      transition: opacity 0.2s ease;
    }

    .badge-close:hover {
      opacity: 1;
    }
  `]
})
export class BadgeComponent {
  @Input() text = '';
  @Input() icon?: string;
  @Input() variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' = 'primary';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() pill = false;
  @Input() dismissible = false;

  onDismiss() {
    // Emit event or handle dismissal
  }
}
